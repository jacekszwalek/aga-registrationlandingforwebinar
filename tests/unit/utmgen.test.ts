import { describe, it, expect } from 'vitest';
import { slugify, parseTarget, buildLink, campaignNotes, campaignFromDate, todayCampaign, resolveSource, toCsv, toTsv } from '../../utmgen/utm.js';
import { DEFAULT_CHANNELS } from '../../utmgen/channels.js';

describe('utmgen – porządki', () => {
  it('małe litery, bez polskich znaków, myślniki', () => {
    expect(slugify('  Zostać, Zmienić Pracę_czy  Pójść ŹŻŁĄ  ')).toBe('zostac-zmienic-prace-czy-pojsc-zzla');
    expect(slugify('Post #1 (rolka)!')).toBe('post-1-rolka');
    expect(slugify('2026-12-03 — Webinar')).toBe('2026-12-03-webinar');
    expect(slugify('')).toBe('');
  });
});

describe('utmgen – adres', () => {
  it('dopisuje https i odrzuca śmieci', () => {
    expect(parseTarget('przystanzmianyzawodowej.pl/webinar/').url!.toString()).toBe('https://przystanzmianyzawodowej.pl/webinar/');
    expect(parseTarget('').ok).toBe(false);
    expect(parseTarget('to nie link').ok).toBe(false);
    expect(parseTarget('mailto:a@b.pl').ok).toBe(false);
  });
  it('wykrywa stare UTM-y', () => {
    expect(parseTarget('https://x.pl/?utm_source=fb&a=1').existingUtm).toEqual(['utm_source']);
  });
});

describe('utmgen – link', () => {
  const t = parseTarget('https://przystanzmianyzawodowej.pl/webinar/?ref=1&utm_source=stare#zapis').url;
  it('zastępuje UTM-y, zachowuje inne parametry i kotwicę, stała kolejność', () => {
    const link = buildLink(t, { source: 'facebook', medium: 'group', campaign: '261203', content: '' });
    expect(link).toBe('https://przystanzmianyzawodowej.pl/webinar/?ref=1&utm_source=facebook&utm_medium=group&utm_campaign=261203#zapis');
  });
  it('dodaje utm_content, gdy podany', () => {
    expect(buildLink(t, { source: 'a', medium: 'b', campaign: 'c', content: 'post-1' })).toContain('utm_content=post-1');
  });
});

describe('utmgen – kampania i kanały', () => {
  it('podpowiedzi – wydarzenie jednorazowe (data RRMMDD)', () => {
    const codes = (v: string) => campaignNotes(v, 'event').map((n: { code: string }) => n.code);
    expect(campaignNotes('261203')).toEqual([]);
    expect(campaignNotes('261203-2', 'event')).toEqual([]);
    expect(codes('Webinar Grudzień')).toEqual(['cleaned', 'name']);
    expect(codes('2026-12-03')).toEqual(['format']);
    expect(codes('261332')).toEqual(['baddate']);
    expect(codes('260229')).toEqual(['baddate']);
    expect(codes('280229')).toEqual([]);
  });
  it('podpowiedzi – cykliczne lub stała kampania (nazwa)', () => {
    const codes = (v: string) => campaignNotes(v, 'name').map((n: { code: string }) => n.code);
    expect(codes('ebook-najlepsza-uczennica')).toEqual([]);
    expect(codes('E-book Najlepsza Uczennica')).toEqual(['cleaned']);
    expect(codes('261203')).toEqual(['looksdate']);
    expect(codes('2026-12')).toEqual(['noname']);
  });
  it('data z kalendarza → RRMMDD', () => {
    expect(campaignFromDate('2026-12-03')).toBe('261203');
    expect(campaignFromDate('')).toBe('');
  });
  it('domyślnie dzisiejsza data', () => {
    expect(todayCampaign(new Date(2026, 10, 16, 23, 30))).toEqual({ campaign: '261116', iso: '2026-11-16' });
    expect(todayCampaign(new Date(2027, 0, 5))).toEqual({ campaign: '270105', iso: '2027-01-05' });
  });
  it('partner wymaga nazwy', () => {
    const partner = DEFAULT_CHANNELS.find((c: { id: string }) => c.id === 'partner');
    expect(resolveSource(partner, '')).toBe('');
    expect(resolveSource(partner, 'Ela Kowalska')).toBe('partner-ela-kowalska');
    expect(resolveSource(DEFAULT_CHANNELS[0], 'x')).toBe('facebook');
  });
  it('domyślne kanały: 6 social media, unikalne pary source+medium', () => {
    const social = DEFAULT_CHANNELS.filter((c: { group: string }) => c.group === 'social').map((c: { source: string }) => c.source);
    expect(social).toEqual(['facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube', 'tiktok']);
    const pairs = DEFAULT_CHANNELS.flatMap((c: { source: string; placements: { medium: string }[] }) => c.placements.map((p) => `${c.source}/${p.medium}`));
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});

describe('utmgen – eksport', () => {
  const rows = [{ channel: 'Facebook', placement: 'Grupa; "mamy"', source: 'facebook', medium: 'group', campaign: 'c', content: '', link: 'https://x.pl/?a=1' }];
  it('CSV ze średnikiem, BOM i cudzysłowami', () => {
    const csv = toCsv(rows);
    expect(csv.startsWith('﻿Kanał;Miejsce;')).toBe(true);
    expect(csv).toContain('Facebook;"Grupa; ""mamy""";facebook;group;c;;https://x.pl/?a=1');
  });
  it('TSV do arkusza', () => {
    expect(toTsv(rows)).toBe('Facebook\tGrupa; "mamy"\thttps://x.pl/?a=1');
  });
});
