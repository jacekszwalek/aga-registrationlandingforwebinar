/**
 * Domyślne kanały. Agnieszka może je zmieniać w „Ustawieniach” (zapis w przeglądarce);
 * ten plik to stan wyjściowy i „Przywróć domyślne”.
 * source – utm_source (skąd), medium – utm_medium (rodzaj kanału).
 * {nazwa} w source = pole do wpisania (np. partner-ela).
 */
export const DEFAULT_CHANNELS = [
  {
    id: 'facebook', label: 'Facebook', source: 'facebook', group: 'social',
    placements: [
      { id: 'post', label: 'Post (profil lub strona)', medium: 'social' },
      { id: 'grupa', label: 'Grupa', medium: 'group' },
      { id: 'wydarzenie', label: 'Wydarzenie FB', medium: 'event' },
      { id: 'messenger', label: 'Messenger', medium: 'message' },
    ],
  },
  {
    id: 'instagram', label: 'Instagram', source: 'instagram', group: 'social',
    placements: [
      { id: 'bio', label: 'Link w bio', medium: 'bio' },
      { id: 'stories', label: 'Stories (naklejka z linkiem)', medium: 'stories' },
      { id: 'dm', label: 'Wiadomość (DM)', medium: 'message' },
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn', source: 'linkedin', group: 'social',
    placements: [
      { id: 'post', label: 'Post lub komentarz', medium: 'social' },
      { id: 'profil', label: 'Profil – sekcja „Polecane”', medium: 'profile' },
      { id: 'wiadomosc', label: 'Wiadomość', medium: 'message' },
    ],
  },
  {
    id: 'whatsapp', label: 'WhatsApp', source: 'whatsapp', group: 'social',
    placements: [
      { id: 'grupa', label: 'Grupa', medium: 'group' },
      { id: 'kanal', label: 'Kanał', medium: 'channel' },
      { id: 'wiadomosc', label: 'Wiadomość', medium: 'message' },
    ],
  },
  {
    id: 'youtube', label: 'YouTube', source: 'youtube', group: 'social',
    placements: [{ id: 'opis', label: 'Opis filmu lub przypięty komentarz', medium: 'video' }],
  },
  {
    id: 'tiktok', label: 'TikTok', source: 'tiktok', group: 'social',
    placements: [{ id: 'bio', label: 'Link w bio', medium: 'bio' }],
  },
  {
    id: 'newsletter', label: 'Newsletter (MailerLite)', source: 'mailerlite', group: 'other',
    placements: [{ id: 'mail', label: 'Mail / kampania', medium: 'email' }],
  },
  {
    id: 'stopka', label: 'Stopka maila', source: 'email-signature', group: 'other',
    placements: [{ id: 'stopka', label: 'Stopka', medium: 'email' }],
  },
  {
    id: 'www', label: 'Strona www / blog', source: 'przystan-www', group: 'other',
    placements: [{ id: 'link', label: 'Link na stronie', medium: 'referral' }],
  },
  {
    id: 'partner', label: 'Partner / polecenie', source: 'partner-{nazwa}', group: 'other',
    placements: [{ id: 'polecenie', label: 'Link od partnera', medium: 'referral' }],
  },
  {
    id: 'qr', label: 'Kod QR (offline)', source: 'qr', group: 'other',
    placements: [{ id: 'druk', label: 'Ulotka, slajd, wizytówka', medium: 'offline' }],
  },
  {
    id: 'meta-ads', label: 'Reklamy Meta (FB/IG)', source: 'meta', group: 'other',
    placements: [{ id: 'reklama', label: 'Reklama', medium: 'paid' }],
  },
  {
    id: 'linkedin-ads', label: 'Reklamy LinkedIn', source: 'linkedin', group: 'other',
    placements: [{ id: 'reklama', label: 'Reklama', medium: 'paid' }],
  },
  {
    id: 'google-ads', label: 'Reklamy Google', source: 'google', group: 'other',
    placements: [{ id: 'reklama', label: 'Reklama', medium: 'cpc' }],
  },
];
