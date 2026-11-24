import { sanitizeLive, sanitizeMessage, slugify, parseTarget, buildLink, campaignNotes, campaignFromDate, todayCampaign, resolveSource, toCsv, toTsv } from './utm.js';
import { DEFAULT_CHANNELS } from './channels.js';

const STORE = { channels: 'utmgen.channels.v1', state: 'utmgen.state.v1', short: 'utmgen.short.v1' };
/** API skracacza (to samo logowanie co licznik webinaru). Na podglądzie GitHub Pages go nie ma – przycisk „Skróć” się nie pokazuje. */
const SHORT_API = '/webinar/licznik/api.php';
const $ = (id) => document.getElementById(id);

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* tryb prywatny – działa bez zapamiętywania */
    }
  },
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const validChannels = (list) =>
  Array.isArray(list) &&
  list.every((c) => c && typeof c.label === 'string' && typeof c.source === 'string' && Array.isArray(c.placements));

let channels = validChannels(store.get(STORE.channels)) ? store.get(STORE.channels) : clone(DEFAULT_CHANNELS);
// Migracja (16.11.2026): „Reklamy Meta (FB/IG)” rozdzielone na Facebook i Instagram.
{
  const i = channels.findIndex((c) => c.id === 'meta-ads' && c.source === 'meta');
  if (i >= 0) {
    channels.splice(i, 1, ...clone(DEFAULT_CHANNELS.filter((c) => c.id === 'facebook-ads' || c.id === 'instagram-ads')));
    store.set(STORE.channels, channels);
  }
}
/** Widoczne w generatorze (ukryte w ustawieniach zostają, ale się nie pokazują). */
const shownPlaces = (c) => (c.hidden ? [] : c.placements.filter((p) => !p.hidden));
const shownChannels = () => channels.filter((c) => shownPlaces(c).length);
const saved = store.get(STORE.state, {});
// Pierwsza wizyta (brak zapisanego wyboru): zaznaczone tylko Facebook – Post. Potem pamiętamy wybór, także pusty.
const DEFAULT_SELECTED = ['facebook:post'];
const state = { pgroup: saved.pgroup === 'other' ? 'other' : 'social', selected: new Set(Array.isArray(saved.selected) ? saved.selected : DEFAULT_SELECTED), partner: '', ctype: saved.ctype === 'name' ? 'name' : 'event', name: saved.name || '' };

const els = {
  target: $('target'), targetNote: $('target-note'),
  campaign: $('campaign'), campaignNotes: $('campaign-notes'),
  content: $('content'), contentNote: $('content-note'),
  picker: $('picker'), result: $('result'), meta: $('res-meta'), acts: $('acts'),
};

const key = (c, p) => `${c.id}:${p.id}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const needsName = (c) => c.source.includes('{nazwa}');
const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);

function persist() {
  if (state.ctype === 'name') state.name = els.campaign.value;
  store.set(STORE.state, { pgroup: state.pgroup, selected: [...state.selected], ctype: state.ctype, name: state.name });
}

/* ---------- Pomoc: dymki po najechaniu, fokusie lub kliknięciu ---------- */
/** Dymek pod przyciskiem, a gdy brakuje miejsca do dolnej krawędzi okna – nad nim; za długi dostaje przewijanie. */
function placeTip(tip) {
  tip.classList.remove('up');
  tip.style.maxHeight = '';
  const btn = tip.previousElementSibling.getBoundingClientRect();
  const margin = 12;
  const below = window.innerHeight - btn.bottom - margin - 8;
  const above = btn.top - margin - 8;
  const h = tip.scrollHeight;
  if (h > below && above > below) tip.classList.add('up');
  const room = tip.classList.contains('up') ? above : below;
  if (h > room) tip.style.maxHeight = `${Math.max(room, 120)}px`;
}

function setupHelp(root = document) {
  root.querySelectorAll('.help').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const tip = document.getElementById(btn.getAttribute('aria-describedby'));
    let pinned = false;
    const show = () => { tip.hidden = false; placeTip(tip); };
    const hide = () => { if (!pinned) tip.hidden = true; };
    btn.addEventListener('mouseenter', show);
    btn.addEventListener('mouseleave', hide);
    btn.addEventListener('focus', show);
    btn.addEventListener('blur', () => { pinned = false; tip.hidden = true; });
    btn.addEventListener('click', () => { pinned = !pinned; tip.hidden = !pinned; });
    btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pinned = false; tip.hidden = true; } });
  });
}

/* ---------- Schowek i powiadomienie ---------- */
let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
async function copy(text, label = 'Skopiowano') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(label);
}

/* ---------- Dane wejściowe ---------- */
function inputs() {
  return { target: parseTarget(els.target.value), campaign: slugify(els.campaign.value), content: slugify(els.content.value) };
}

function renderNotes({ target, content }) {
  const t = els.target.value.trim();
  let note = '';
  if (t && !target.ok) note = 'To nie wygląda na adres strony – sprawdź, czy wkleiłaś cały link.';
  else if (target.ok && target.existingUtm.length) note = `Link miał już ${target.existingUtm.join(', ')} – zastąpimy je nowymi.`;
  else if (target.ok && target.insecure) note = 'Adres zaczyna się od http:// – jeśli strona ma https://, użyj go.';
  els.targetNote.textContent = note;
  els.targetNote.className = 'note' + (t && !target.ok ? ' warn' : '');
  els.campaignNotes.innerHTML = campaignNotes(els.campaign.value, state.ctype).map((n) => `<li class="${n.level}">${esc(n.text)}</li>`).join('');
  const badge = $('content-badge');
  badge.hidden = !content;
  badge.textContent = content;
  const raw = els.content.value.trim();
  els.contentNote.textContent = raw && content !== raw ? `Zapiszemy jako: ${content}` : '';
}

function missingText({ target, campaign }) {
  if (!target.ok && !campaign) return 'Wklej adres strony i wpisz kampanię.';
  if (!target.ok) return 'Wklej poprawny adres strony.';
  if (!campaign) return state.ctype === 'name' ? 'Wpisz nazwę kampanii, np. ebook-najlepsza-uczennica.' : 'Wpisz datę rozpoczęcia wydarzenia (RRMMDD).';
  return '';
}

function linkRow(c, p, base) {
  const source = resolveSource(c, state.partner);
  if (!source) return null;
  const medium = slugify(p.medium);
  return {
    channel: c.label, placement: p.label, source, medium, campaign: base.campaign, content: base.content,
    link: buildLink(base.target.url, { source, medium, campaign: base.campaign, content: base.content }),
  };
}

/* ---------- Lewy panel: miejsca ---------- */
const inGroup = (c, g) => (g === 'social' ? c.group === 'social' : c.group !== 'social');

function renderPicker() {
  const list = shownChannels().filter((c) => inGroup(c, state.pgroup));
  els.picker.innerHTML = list.length
    ? list
        .map((c) => `
        <div class="pick-ch">
          ${shownPlaces(c).length > 1
            ? `<label class="pick-name pick-all"><input type="checkbox" data-channel="${esc(c.id)}" aria-label="${esc(c.label)} – zaznacz lub odznacz wszystkie miejsca"><span>${esc(c.label)}</span></label>`
            : `<span class="pick-name">${esc(c.label)}</span>`}
          ${shownPlaces(c).map((p) => `
            <label class="it"><input type="checkbox" value="${esc(key(c, p))}" ${state.selected.has(key(c, p)) ? 'checked' : ''}>
              <span class="it-l">${esc(p.label)}</span><small>${esc(slugify(p.medium))}</small></label>`).join('')}
          ${needsName(c) ? partnerFieldHtml() : ''}
        </div>`)
        .join('')
    : '<p class="empty">Brak widocznych kanałów w tej zakładce – włącz je w „Ustawieniach kanałów”.</p>';
  updateCounts();
  updatePartnerField();
  syncChannelBoxes();
  setupHelp(els.picker);
}

/** Pole „Nazwa partnera” – tuż pod miejscem „Partner / polecenie”, widoczne tylko po jego zaznaczeniu. */
const PARTNER_TIP = '<b>Partner / polecenie</b> – link, który dajesz <b>komuś innemu</b>, żeby polecił wydarzenie swoim odbiorcom (np. znajoma coachka w swoim newsletterze, fundacja na swoim profilu). Każdy partner dostaje własny link, np. <code>utm_source=partner-ela</code>, <code>utm_medium=referral</code>. W GA4 i w MailerLite (pole <code>webinar_source</code>) zobaczysz, ile zapisów przyprowadził – możesz podziękować konkretną liczbą i wiesz, z kim warto współpracować dalej. To co innego niż „Udostępnij” na stronie podziękowania (<code>utm_source=referral</code> – polecenia od zapisanych osób, bez nazwy). <b>Nazwa jest widoczna w linku</b> – wpisuj imię lub markę, które partner zna i akceptuje. Nie używasz? Ukryj w „Ustawienia kanałów ⚙” → „Pokazuj”.';
function partnerFieldHtml() {
  return `
          <div class="partner" id="partner-field" hidden>
            <div class="lab-row">
              <label for="partner">Nazwa partnera</label>
              <span class="help-wrap">
                <button type="button" class="help" aria-label="Pomoc: partner" aria-describedby="tip-partner">?</button>
                <span role="tooltip" id="tip-partner" class="tip" hidden>${PARTNER_TIP}</span>
              </span>
            </div>
            <input id="partner" type="text" autocomplete="off" spellcheck="false" placeholder="np. ela, fundacja-xyz" value="${esc(state.partner)}">
          </div>`;
}

/** Liczba zaznaczonych miejsc przy zakładkach. */
function updateCounts() {
  for (const g of ['social', 'other']) {
    const n = channels.filter((c) => inGroup(c, g)).reduce((sum, c) => sum + shownPlaces(c).filter((p) => state.selected.has(key(c, p))).length, 0);
    $(`cnt-${g}`).textContent = n ? ` (${n})` : '';
  }
}

/** Checkbox przy platformie: zaznaczony = wszystkie miejsca, częściowo = niektóre. */
function syncChannelBoxes() {
  els.picker.querySelectorAll('input[data-channel]').forEach((box) => {
    const c = channels.find((x) => x.id === box.dataset.channel);
    const places = shownPlaces(c);
    const n = places.filter((p) => state.selected.has(key(c, p))).length;
    box.checked = n === places.length;
    box.indeterminate = n > 0 && n < places.length;
  });
}

function updatePartnerField() {
  const field = $('partner-field');
  if (field) field.hidden = !channels.some((c) => needsName(c) && shownPlaces(c).some((p) => state.selected.has(key(c, p))));
}

/* ---------- Prawy panel: gotowe linki ---------- */
/* ---------- Skracacz ---------- */
const shortener = { available: false, loggedIn: false };
const shortMap = store.get(STORE.short, {}); // długi link → { short }
const shortOpen = new Set(); // długie linki z otwartym polem „własny kod”

async function shortApi(body) {
  const res = await fetch(SHORT_API, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({ ok: false, error: 'Brak odpowiedzi serwera.' }));
  return { status: res.status, ...data };
}

/** Okno logowania; zwraca true po udanym logowaniu. */
function askLogin() {
  const dlg = $('login');
  const form = dlg.querySelector('form');
  const err = $('login-err');
  err.textContent = '';
  form.reset();
  dlg.showModal();
  return new Promise((resolve) => {
    const onSubmit = async (e) => {
      e.preventDefault();
      if (e.submitter?.value === 'cancel') return done(false);
      const r = await shortApi({ action: 'login', password: $('login-pass').value });
      if (r.ok) {
        shortener.loggedIn = true;
        done(true);
      } else err.textContent = r.error || 'Nie udało się zalogować.';
    };
    const done = (v) => {
      form.removeEventListener('submit', onSubmit);
      dlg.close();
      resolve(v);
    };
    form.addEventListener('submit', onSubmit);
    dlg.addEventListener('cancel', () => done(false), { once: true });
  });
}

function shortBlock(i, r) {
  const s = shortMap[r.link];
  if (s) {
    return `<div class="ln-short">
      <span class="ln-l">Krótki link</span>
      <code class="ln-u">${esc(s.short)}</code>
      <button type="button" class="cp" data-copy-short="${i}" aria-label="Kopiuj krótki link: ${esc(r.channel)}, ${esc(r.placement)}">Kopiuj</button>
    </div>`;
  }
  if (!shortOpen.has(r.link)) return '';
  const suggest = slugify(`${r.source}-${r.campaign}`);
  return `<div class="ln-short ln-make">
    <label class="ln-l" for="sc-${i}">Własny kod</label>
    <input id="sc-${i}" class="sc-in" type="text" autocomplete="off" spellcheck="false" maxlength="40" placeholder="np. ${esc(suggest)} – puste = kod losowy" aria-describedby="se-${i}">
    <button type="button" class="cp" data-make-short="${i}">Utwórz</button>
    <p class="note ln-note" id="se-${i}" aria-live="polite"></p>
  </div>`;
}

async function makeShort(i) {
  const r = currentRows[i];
  const input = $(`sc-${i}`);
  const err = $(`se-${i}`);
  const code = slugify(input?.value || '');
  let res = await shortApi({ action: 'shorten', url: r.link, code });
  if (res.status === 401 && (await askLogin())) res = await shortApi({ action: 'shorten', url: r.link, code });
  if (!res.ok) {
    if (err) err.textContent = res.error || 'Nie udało się skrócić linku.';
    return;
  }
  shortMap[r.link] = { short: res.short };
  store.set(STORE.short, shortMap);
  shortOpen.delete(r.link);
  render();
  copy(res.short, res.existing ? 'Ten link był już skrócony – skopiowano krótki link' : 'Krótki link skopiowany');
}

/* ---------- Krótkie linki – lista ---------- */
const SL_STATES = { current: 'Bieżące', active: 'Aktywne', sleeping: 'Uśpione', archived: 'Zarchiwizowane', all: 'Wszystkie' };
const SL_BADGE = { active: 'Aktywny', sleeping: 'Uśpiony', archived: 'Zarchiwizowany' };
const sl = { links: [], filter: 'current', q: '', loaded: false, error: '' };
const UTM_CLASS = { utm_source: 'p-src', utm_medium: 'p-med', utm_campaign: 'p-cmp', utm_content: 'p-ct', utm_term: 'p-term' };
/** Krótki link: domena i ścieżka zwykłym tekstem, kod wyróżniony. */
function shortHtml(short) {
  const m = /^https?:\/\/(.*\/l\/)([^/]+)$/.exec(short);
  return m ? `${esc(m[1])}<span class="sl-code">${esc(m[2])}</span>` : esc(short);
}
/** Adres docelowy rozłożony: parametry UTM w kolorach, „&” i reszta adresu bez tła – wygląda jak prawdziwy link. */
function urlHtml(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return esc(url);
  }
  const base = `${u.host}${u.pathname}`;
  const params = [...u.searchParams.entries()].map(([k, v]) => {
    const pair = `<span class="k">${esc(k)}=</span>${esc(v)}`;
    return UTM_CLASS[k] ? `<span class="p ${UTM_CLASS[k]}">${pair}</span>` : `<span>${esc(k)}=${esc(v)}</span>`;
  });
  return `<span class="base">${esc(base)}${params.length ? '?' : ''}</span>${params.join('<span class="amp">&amp;</span>')}${u.hash ? `<span class="base">${esc(u.hash)}</span>` : ''}`;
}
const fmtDate = (t) => (t ? new Date(t * 1000).toLocaleDateString('pl-PL') : '–');

async function loadLinks() {
  let res = await shortApi({ action: 'list' });
  if (res.status === 401 && (await askLogin())) res = await shortApi({ action: 'list' });
  if (!res.ok) {
    sl.error = res.error || 'Nie udało się pobrać listy.';
    return false;
  }
  sl.links = res.links;
  sl.loaded = true;
  sl.error = '';
  return true;
}

function slMatches(l) {
  if (sl.filter === 'current' && l.state === 'archived') return false;
  if (!['current', 'all'].includes(sl.filter) && l.state !== sl.filter) return false;
  if (!sl.q) return true;
  return `${l.short} ${l.url}`.toLowerCase().includes(sl.q);
}

function renderLinks() {
  const count = (f) => sl.links.filter((l) => (f === 'all' ? true : f === 'current' ? l.state !== 'archived' : l.state === f)).length;
  $('sl-tabs').innerHTML = Object.entries(SL_STATES)
    .map(([k, label]) => `<button type="button" data-sl-filter="${k}" aria-pressed="${sl.filter === k}">${label} <b>${count(k)}</b></button>`)
    .join('');
  const list = sl.links.filter(slMatches);
  if (sl.error) {
    $('sl-list').innerHTML = `<p class="note warn">${esc(sl.error)}</p>`;
    return;
  }
  if (!list.length) {
    $('sl-list').innerHTML = `<p class="sl-empty">${sl.links.length ? 'Brak linków dla tego filtra.' : 'Nie ma jeszcze krótkich linków – utwórz je przyciskiem „Skróć” przy gotowym linku.'}</p>`;
    return;
  }
  $('sl-list').innerHTML = list
    .map((l) => {
      return `<article class="sl">
        <div><span class="sl-short">${shortHtml(l.short)}</span><span class="sl-badge ${l.state}">${SL_BADGE[l.state]}</span></div>
        <div class="sl-to">↳ prowadzi do</div>
        <div class="sl-url">${urlHtml(l.url)}</div>
        <div class="sl-stats"><b>${l.clicks}</b> ${plural(l.clicks, 'kliknięcie', 'kliknięcia', 'kliknięć')} · ostatnie: ${fmtDate(l.last)} · ${l.last ? `bez kliknięć od <b>${l.idle}</b> dni` : '<b>nigdy nieklikany</b>'} · utworzony ${fmtDate(l.created)}</div>
        <div class="sl-act">
          <button type="button" class="cp" data-sl-copy="${esc(l.code)}" aria-label="Kopiuj ${esc(l.short)}">Kopiuj</button>
          <button type="button" class="cp" data-sl-del="${esc(l.code)}" aria-label="Usuń ${esc(l.short)}">Usuń</button>
        </div>
      </article>`;
    })
    .join('');
}

async function openLinks() {
  if (!shortener.loggedIn && !(await askLogin())) return;
  const dlg = $('links');
  $('sl-list').innerHTML = '<p class="sl-empty">Wczytuję…</p>';
  if (!dlg.open) dlg.showModal();
  await loadLinks();
  renderLinks();
}

function setupLinks() {
  const dlg = $('links');
  $('open-links').addEventListener('click', openLinks);
  dlg.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close-links]')) return dlg.close();
    const f = e.target.closest('[data-sl-filter]');
    if (f) {
      sl.filter = f.dataset.slFilter;
      renderLinks();
    }
    const c = e.target.closest('[data-sl-copy]');
    if (c) copy(sl.links.find((l) => l.code === c.dataset.slCopy).short, 'Krótki link skopiowany');
    const d = e.target.closest('[data-sl-del]');
    if (d) {
      const l = sl.links.find((x) => x.code === d.dataset.slDel);
      const warn = l.clicks > 0 ? `\n\nUwaga: ten link ma ${l.clicks} ${plural(l.clicks, 'kliknięcie', 'kliknięcia', 'kliknięć')} – jeśli nadal gdzieś krąży, osoby trafią na stronę nadrzędną bez UTM-ów.` : '';
      if (!confirm(`Usunąć ${l.short}?\nJego adres będzie prowadził na stronę nadrzędną.${warn}`)) return;
      const res = await shortApi({ action: 'delete', code: l.code });
      if (!res.ok) return toast(res.error || 'Nie udało się usunąć.');
      // Usunięty link znika też z pamięci generatora.
      for (const [k, v] of Object.entries(shortMap)) if (v.short === l.short) delete shortMap[k];
      store.set(STORE.short, shortMap);
      toast('Link usunięty');
      await loadLinks();
      renderLinks();
      render();
    }
  });
  $('sl-q').addEventListener('input', (e) => {
    sl.q = e.target.value.trim().toLowerCase();
    renderLinks();
  });
}

let currentRows = [];
let currentGroups = [];
function renderResult(base) {
  currentRows = [];
  currentGroups = [];
  const missing = missingText(base);
  let skipped = false;
  if (!missing) {
    for (const c of channels) {
      const rows = [];
      for (const p of shownPlaces(c)) {
        if (!state.selected.has(key(c, p))) continue;
        const row = linkRow(c, p, base);
        if (row) {
          rows.push(currentRows.length);
          currentRows.push(row);
        } else skipped = true;
      }
      if (rows.length) currentGroups.push({ c, rows });
    }
  }
  const n = currentRows.length;
  els.acts.hidden = !n;
  const jump = $('jump');
  jump.hidden = !n;
  jump.textContent = `Gotowe: ${n} ${plural(n, 'link', 'linki', 'linków')} ↓`;
  els.meta.textContent = n ? `${n} ${plural(n, 'link', 'linki', 'linków')} · kampania ${base.campaign}${base.content ? ` · materiał ${base.content}` : ''}` : '';
  if (!n) {
    const msg = missing || (skipped ? 'Wpisz nazwę partnera.' : 'Zaznacz po lewej, gdzie wrzucasz link.');
    els.result.innerHTML = `<p class="empty">${esc(msg)}</p>`;
    return;
  }
  els.result.innerHTML =
    (skipped ? '<p class="note warn">Partner pominięty – wpisz jego nazwę.</p>' : '') +
    currentGroups
      .map(({ c, rows }, gi) => `
        <section class="plat" aria-labelledby="pl-${gi}">
          <div class="plat-head">
            <h3 id="pl-${gi}">${esc(c.label)}</h3>
            ${rows.length > 1 ? `<button type="button" class="cp" data-copy-group="${gi}" aria-label="Kopiuj ${rows.length} – wszystkie linki: ${esc(c.label)}">Kopiuj ${rows.length}</button>` : ''}
          </div>
          ${rows.map((i) => {
            const r = currentRows[i];
            return `
          <div class="ln">
            <span class="ln-l">${esc(r.placement)}</span>
            <code class="ln-u" title="${esc(r.link)}">${esc(r.link)}</code>
            <span class="ln-btns">
              <button type="button" class="cp" data-copy="${i}" aria-label="Kopiuj link: ${esc(r.channel)}, ${esc(r.placement)}">Kopiuj</button>
              ${shortener.available && !shortMap[r.link] ? `<button type="button" class="cp" data-short="${i}" aria-expanded="${shortOpen.has(r.link)}" aria-label="Skróć link: ${esc(r.channel)}, ${esc(r.placement)}">Skróć</button>` : ''}
            </span>
          </div>${shortBlock(i, r)}`;
          }).join('')}
        </section>`)
      .join('');
}

function render() {
  const base = inputs();
  renderNotes(base);
  renderResult(base);
  persist();
}

/* ---------- Ustawienia kanałów ---------- */
function saveChannels() {
  store.set(STORE.channels, channels);
  renderPicker();
  render();
}

function renderEditor() {
  $('editor').innerHTML = channels
    .map((c, ci) => `
      <fieldset class="ed-channel${c.hidden ? ' is-hidden' : ''}" data-ci="${ci}">
        <legend class="visually-hidden">${esc(c.label)}</legend>
        <div class="ed-row">
          <label>Nazwa<input data-f="label" value="${esc(c.label)}"></label>
          <label>Kanał (utm_source)<input data-f="source" value="${esc(c.source)}" spellcheck="false"></label>
          <label class="ed-group">Grupa<select data-f="group">
            <option value="social" ${c.group === 'social' ? 'selected' : ''}>Social media</option>
            <option value="other" ${c.group !== 'social' ? 'selected' : ''}>Inne</option>
          </select></label>
          <label class="ed-show"><input type="checkbox" data-f="visible" ${c.hidden ? '' : 'checked'}> Pokazuj</label>
          <button type="button" class="icon danger" data-del-channel="${ci}" aria-label="Usuń kanał ${esc(c.label)}">Usuń</button>
        </div>
        <ul class="ed-places">
          ${c.placements.map((p, pi) => `
            <li data-pi="${pi}"${p.hidden ? ' class="is-hidden"' : ''}>
              <label>Miejsce<input data-p="label" value="${esc(p.label)}"></label>
              <label>Wartość (utm_medium)<input data-p="medium" value="${esc(p.medium)}" spellcheck="false"></label>
              <label class="ed-show"><input type="checkbox" data-p="visible" ${p.hidden ? '' : 'checked'}> Pokazuj</label>
              <button type="button" class="icon danger" data-del-place="${pi}" aria-label="Usuń miejsce ${esc(p.label)}">×</button>
            </li>`).join('')}
        </ul>
        <button type="button" class="link-btn" data-add-place="${ci}">+ Dodaj miejsce</button>
      </fieldset>`)
    .join('');
}

function uid(base, taken) {
  let id = slugify(base) || 'kanal';
  while (taken.includes(id)) id += '-1';
  return id;
}

function setupSettings() {
  const dlg = $('settings');
  $('open-settings').addEventListener('click', () => {
    renderEditor();
    dlg.showModal();
  });
  dlg.addEventListener('close', saveChannels);

  $('editor').addEventListener('change', (e) => {
    const t = e.target;
    const ci = Number(t.closest('[data-ci]')?.dataset.ci);
    const c = channels[ci];
    if (!c) return;
    if (t.dataset.f === 'visible' || t.dataset.p === 'visible') {
      const target = t.dataset.p ? c.placements[Number(t.closest('[data-pi]').dataset.pi)] : c;
      if (t.checked) delete target.hidden;
      else target.hidden = true;
      t.closest(t.dataset.p ? 'li' : 'fieldset').classList.toggle('is-hidden', !t.checked);
      store.set(STORE.channels, channels);
      return;
    }
    if (t.dataset.f) {
      c[t.dataset.f] = t.dataset.f === 'source' ? slugify(t.value.replace('{nazwa}', 'NAZWAX')).replace('nazwax', '{nazwa}') : t.value.trim();
      if (t.dataset.f === 'source') t.value = c.source;
    }
    if (t.dataset.p) {
      const p = c.placements[Number(t.closest('[data-pi]').dataset.pi)];
      p[t.dataset.p] = t.dataset.p === 'medium' ? slugify(t.value) : t.value.trim();
      if (t.dataset.p === 'medium') t.value = p.medium;
    }
    store.set(STORE.channels, channels);
  });

  $('editor').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const ci = Number(t.closest('[data-ci]')?.dataset.ci);
    if (t.dataset.delChannel !== undefined) channels.splice(ci, 1);
    else if (t.dataset.delPlace !== undefined) channels[ci].placements.splice(Number(t.dataset.delPlace), 1);
    else if (t.dataset.addPlace !== undefined) {
      const c = channels[ci];
      c.placements.push({ id: uid('miejsce', c.placements.map((p) => p.id)), label: 'Nowe miejsce', medium: 'social' });
    } else return;
    store.set(STORE.channels, channels);
    renderEditor();
  });

  $('add-channel').addEventListener('click', () => {
    channels.push({
      id: uid('nowy-kanal', channels.map((c) => c.id)), label: 'Nowy kanał', source: 'nowy-kanal', group: 'social',
      placements: [{ id: 'post', label: 'Post', medium: 'social' }],
    });
    store.set(STORE.channels, channels);
    renderEditor();
    $('editor').lastElementChild?.querySelector('input')?.focus();
  });

  $('reset-settings').addEventListener('click', () => {
    channels = clone(DEFAULT_CHANNELS);
    store.set(STORE.channels, channels);
    renderEditor();
    toast('Przywrócono domyślne kanały');
  });

  $('export-settings').addEventListener('click', () => {
    download('utmgen-ustawienia.json', JSON.stringify(channels, null, 2), 'application/json');
  });

  $('import-settings').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!validChannels(data)) throw new Error('format');
      channels = data;
      store.set(STORE.channels, channels);
      renderEditor();
      toast('Wczytano ustawienia');
    } catch {
      toast('To nie jest plik ustawień generatora');
    }
    e.target.value = '';
  });
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Rodzaj kampanii ---------- */
const CAMPAIGN_TYPES = {
  event: {
    placeholder: `np. ${todayCampaign().campaign}`, // bieżąca data jako podpowiedź w tle (pole puste)
    inputMode: 'numeric',
    rules: `Nazwa kampanii · sugerowany format: RRMMDD – data rozpoczęcia wydarzenia, ale możesz wpisać dowolną nazwę · dwa wydarzenia jednego dnia: ${todayCampaign().campaign}-2`, // bieżąca data
  },
  name: {
    placeholder: 'np. ebook-najlepsza-uczennica',
    inputMode: 'text',
    rules: 'Nazwa kampanii - sugerowany format: [przedmiot kampanii]-[nazwa lub tytuł kampanii] · stała przez cały czas trwania kampanii · nazwa będzie widoczna w linku',
  },
};

/**
 * 'event' – wydarzenie jednorazowe: data rozpoczęcia RRMMDD (start: dziś), kalendarz obok.
 * 'name'  – cykliczne / stała kampania: nazwa (zapamiętana z ostatniego użycia), bez kalendarza.
 */
function applyCampaignType(type, first = false) {
  state.ctype = type;
  const t = CAMPAIGN_TYPES[type];
  const isEvent = type === 'event';
  $('campaign-date').hidden = !isEvent;
  $('campaign-row').classList.toggle('single', !isEvent);
  els.campaign.inputMode = t.inputMode;
  els.campaign.placeholder = t.placeholder;
  $('campaign-rules').textContent = t.rules;
  // Jednorazowe: pole puste (bieżąca data tylko jako podpowiedź w tle) albo data wybrana wcześniej w kalendarzu.
  els.campaign.value = isEvent ? campaignFromDate($('campaign-date').value) : state.name;
  if (!first) els.campaign.focus();
}

/* ---------- Start ---------- */
function init() {
  applyCampaignType(state.ctype, true);
  document.querySelectorAll('input[name="ctype"]').forEach((r) => {
    r.checked = r.value === state.ctype;
    r.addEventListener('change', () => {
      if (state.ctype === 'name') state.name = els.campaign.value;
      applyCampaignType(r.value);
      render();
    });
  });
  renderPicker();
  setupHelp();
  setupSettings();
  setupLinks();

  // Kampania: niedozwolone znaki zamieniane w locie + komunikat (musi działać przed render).
  let fixTimer;
  els.campaign.addEventListener('input', () => {
    const el = els.campaign;
    const r = sanitizeLive(el.value, el.selectionStart ?? el.value.length);
    const fix = $('campaign-fix');
    if (r.value !== el.value) {
      el.value = r.value;
      el.setSelectionRange(r.caret, r.caret);
    }
    const msg = sanitizeMessage(r.changes);
    if (msg) {
      fix.textContent = msg;
      fix.hidden = false;
      clearTimeout(fixTimer);
      fixTimer = setTimeout(() => { fix.hidden = true; }, 8000);
    }
  });
  for (const el of [els.target, els.campaign, els.content]) el.addEventListener('input', render);
  els.picker.addEventListener('input', (e) => {
    if (e.target.id !== 'partner') return;
    state.partner = e.target.value;
    render();
  });
  // Kalendarz pokazuje datę wpisanej kampanii (RRMMDD → RRRR-MM-DD).
  els.campaign.addEventListener('input', () => {
    if (state.ctype !== 'event') return;
    const m = /^(\d{2})(\d{2})(\d{2})/.exec(slugify(els.campaign.value));
    $('campaign-date').value = m ? `20${m[1]}-${m[2]}-${m[3]}` : '';
  });
  $('campaign-date').addEventListener('change', (e) => {
    const v = campaignFromDate(e.target.value);
    if (v) {
      els.campaign.value = v;
      render();
    }
  });

  els.picker.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    const chId = e.target.dataset.channel;
    if (chId) {
      const c = channels.find((x) => x.id === chId);
      for (const p of shownPlaces(c)) {
        const k = key(c, p);
        if (e.target.checked) state.selected.add(k);
        else state.selected.delete(k);
        const box = els.picker.querySelector(`input[value="${CSS.escape(k)}"]`);
        if (box) box.checked = e.target.checked;
      }
    } else if (e.target.checked) state.selected.add(e.target.value);
    else state.selected.delete(e.target.value);
    syncChannelBoxes();
    updatePartnerField();
    updateCounts();
    render();
  });
  document.querySelectorAll('input[name="pgroup"]').forEach((r) => {
    r.checked = r.value === state.pgroup;
    r.addEventListener('change', () => {
      state.pgroup = r.value;
      renderPicker();
      persist();
    });
  });
  document.querySelectorAll('[data-select]').forEach((b) =>
    b.addEventListener('click', () => {
      // Działa w otwartej zakładce; zaznaczenia w drugiej zakładce zostają.
      const on = b.dataset.select === 'tab';
      for (const c of channels.filter((x) => inGroup(x, state.pgroup))) {
        for (const p of shownPlaces(c)) {
          if (on) state.selected.add(key(c, p));
          else state.selected.delete(key(c, p));
        }
      }
      renderPicker();
      render();
    }),
  );

  els.result.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copy(currentRows[Number(b.dataset.copy)].link, 'Link skopiowany');
    const cs = e.target.closest('[data-copy-short]');
    if (cs) copy(shortMap[currentRows[Number(cs.dataset.copyShort)].link].short, 'Krótki link skopiowany');
    const sh = e.target.closest('[data-short]');
    if (sh) {
      const i = Number(sh.dataset.short);
      const link = currentRows[i].link;
      (async () => {
        if (!shortener.loggedIn && !(await askLogin())) return;
        if (shortOpen.has(link)) shortOpen.delete(link);
        else shortOpen.add(link);
        render();
        $(`sc-${i}`)?.focus();
      })();
    }
    const mk = e.target.closest('[data-make-short]');
    if (mk) makeShort(Number(mk.dataset.makeShort));
    const g = e.target.closest('[data-copy-group]');
    if (g) {
      const group = currentGroups[Number(g.dataset.copyGroup)];
      copy(toTsv(group.rows.map((i) => currentRows[i])), `Skopiowano linki: ${group.c.label}`);
    }
  });
  $('copy-all').addEventListener('click', () => copy(toTsv(currentRows), `Skopiowano ${currentRows.length} ${plural(currentRows.length, 'link', 'linki', 'linków')}`));
  $('download-csv').addEventListener('click', () => {
    download(`utm-${slugify(els.campaign.value) || 'linki'}.csv`, toCsv(currentRows), 'text/csv;charset=utf-8');
  });

  els.result.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList?.contains('sc-in')) makeShort(Number(e.target.id.slice(3)));
  });
  // Skracacz dostępny tylko na naszym serwerze (na podglądzie GitHub Pages API nie istnieje).
  fetch(SHORT_API, { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.ok) {
        shortener.available = true;
        shortener.loggedIn = !!d.loggedIn;
        $('open-links').hidden = false;
        render();
        if (location.hash === '#krotkie-linki') openLinks();
      }
    })
    .catch(() => {});

  render();
}

init();
