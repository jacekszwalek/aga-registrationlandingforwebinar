import { slugify, parseTarget, buildLink, campaignNotes, campaignFromDate, todayCampaign, resolveSource, toCsv, toTsv } from './utm.js';
import { DEFAULT_CHANNELS } from './channels.js';

const STORE = { channels: 'utmgen.channels.v1', state: 'utmgen.state.v1' };
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
const saved = store.get(STORE.state, {});
const state = {
  mode: saved.mode === 'set' ? 'set' : 'single',
  channel: saved.channel || channels[0]?.id,
  placement: saved.placement || '',
  selected: new Set(saved.selected || []),
};

const els = {
  target: $('target'), targetNote: $('target-note'),
  campaign: $('campaign'), campaignNotes: $('campaign-notes'),
  content: $('content'), contentNote: $('content-note'),
  channel: $('channel'), placement: $('placement'),
  partnerField: $('partner-field'), partner: $('partner'),
  partnerSetField: $('partner-set-field'), partnerSet: $('partner-set'),
  single: $('single-result'), picker: $('picker'), set: $('set-result'), setActions: $('set-actions'),
};

const key = (c, p) => `${c.id}:${p.id}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const needsName = (c) => c.source.includes('{nazwa}');

function persist() {
  store.set(STORE.state, {
    mode: state.mode, channel: state.channel, placement: state.placement,
    selected: [...state.selected],
  });
}

/* ---------- Pomoc: dymki po najechaniu, fokusie lub kliknięciu ---------- */
function setupHelp(root = document) {
  root.querySelectorAll('.help').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const tip = document.getElementById(btn.getAttribute('aria-describedby'));
    let pinned = false;
    const show = () => { tip.hidden = false; };
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
  const target = parseTarget(els.target.value);
  const campaign = slugify(els.campaign.value);
  const content = slugify(els.content.value);
  return { target, campaign, content };
}

function renderNotes({ target, content }) {
  const t = els.target.value.trim();
  let note = '';
  if (t && !target.ok) note = 'To nie wygląda na adres strony – sprawdź, czy wkleiłaś cały link.';
  else if (target.ok && target.existingUtm.length) note = `Link miał już ${target.existingUtm.join(', ')} – zastąpimy je nowymi.`;
  else if (target.ok && target.insecure) note = 'Adres zaczyna się od http:// – jeśli strona ma https://, użyj go.';
  els.targetNote.textContent = note;
  els.targetNote.className = 'note' + (t && !target.ok ? ' warn' : '');

  els.campaignNotes.innerHTML = campaignNotes(els.campaign.value)
    .map((n) => `<li class="${n.level}">${esc(n.text)}</li>`)
    .join('');

  const rawContent = els.content.value.trim();
  els.contentNote.textContent = rawContent && content !== rawContent ? `Zapiszemy jako: ${content}` : '';
}

function missingText({ target, campaign }) {
  if (!target.ok && !campaign) return 'Uzupełnij adres strony i nazwę kampanii.';
  if (!target.ok) return 'Uzupełnij poprawny adres strony.';
  if (!campaign) return 'Uzupełnij nazwę kampanii.';
  return '';
}

function linkRow(c, p, base, name) {
  const source = resolveSource(c, name);
  if (!source) return null;
  const medium = slugify(p.medium);
  return {
    channel: c.label, placement: p.label, source, medium, campaign: base.campaign, content: base.content,
    link: buildLink(base.target.url, { source, medium, campaign: base.campaign, content: base.content }),
  };
}

/* ---------- Jeden link ---------- */
function fillChannelSelect() {
  if (!channels.some((c) => c.id === state.channel)) state.channel = channels[0]?.id;
  const opt = (c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`;
  const social = channels.filter((c) => c.group === 'social');
  const other = channels.filter((c) => c.group !== 'social');
  els.channel.innerHTML =
    (social.length ? `<optgroup label="Social media">${social.map(opt).join('')}</optgroup>` : '') +
    (other.length ? `<optgroup label="Inne kanały">${other.map(opt).join('')}</optgroup>` : '');
  els.channel.value = state.channel;
  fillPlacementSelect();
}

function fillPlacementSelect() {
  const c = channels.find((x) => x.id === state.channel);
  const list = c?.placements || [];
  if (!list.some((p) => p.id === state.placement)) state.placement = list[0]?.id || '';
  els.placement.innerHTML = list
    .map((p) => `<option value="${esc(p.id)}">${esc(p.label)} – ${esc(slugify(p.medium))}</option>`)
    .join('');
  els.placement.value = state.placement;
  els.partnerField.hidden = !(c && needsName(c));
}

function renderSingle(base) {
  const missing = missingText(base);
  const c = channels.find((x) => x.id === state.channel);
  const p = c?.placements.find((x) => x.id === state.placement);
  if (missing || !c || !p) {
    els.single.innerHTML = `<p class="empty">${esc(missing || 'Wybierz kanał i miejsce.')}</p>`;
    return;
  }
  const row = linkRow(c, p, base, els.partner.value);
  if (!row) {
    els.single.innerHTML = '<p class="empty">Wpisz nazwę partnera.</p>';
    return;
  }
  els.single.innerHTML = `
    <div class="link-box">
      <code class="link" id="single-link">${esc(row.link)}</code>
      <button type="button" class="btn" id="copy-single">Kopiuj link</button>
    </div>
    <p class="params">${['source', 'medium', 'campaign', 'content']
      .filter((k) => row[k])
      .map((k) => `<span><b>utm_${k}</b> ${esc(row[k])}</span>`)
      .join('')}</p>`;
  $('copy-single').addEventListener('click', () => copy(row.link, 'Link skopiowany'));
}

/* ---------- Komplet ---------- */
function renderPicker() {
  const groups = [
    ['Social media', channels.filter((c) => c.group === 'social')],
    ['Inne kanały', channels.filter((c) => c.group !== 'social')],
  ];
  els.picker.innerHTML = groups
    .filter(([, list]) => list.length)
    .map(([title, list]) => `
      <fieldset>
        <legend>${esc(title)}</legend>
        ${list.map((c) => `
          <div class="pick-channel">
            <span class="pick-name">${esc(c.label)}</span>
            <div class="pick-places">
              ${c.placements.map((p) => `
                <label class="chip"><input type="checkbox" value="${esc(key(c, p))}" ${state.selected.has(key(c, p)) ? 'checked' : ''}>
                  <span>${esc(p.label)}</span></label>`).join('')}
            </div>
          </div>`).join('')}
      </fieldset>`)
    .join('');
  updatePartnerSetField();
}

function updatePartnerSetField() {
  const any = channels.some((c) => needsName(c) && c.placements.some((p) => state.selected.has(key(c, p))));
  els.partnerSetField.hidden = !any;
}

let currentRows = [];
function renderSet(base) {
  const missing = missingText(base);
  currentRows = [];
  if (missing) {
    els.set.innerHTML = `<p class="empty">${esc(missing)}</p>`;
    els.setActions.hidden = true;
    return;
  }
  let skipped = false;
  for (const c of channels) {
    for (const p of c.placements) {
      if (!state.selected.has(key(c, p))) continue;
      const row = linkRow(c, p, base, els.partnerSet.value);
      if (row) currentRows.push(row);
      else skipped = true;
    }
  }
  if (!currentRows.length) {
    els.set.innerHTML = `<p class="empty">${skipped ? 'Wpisz nazwę partnera.' : 'Zaznacz co najmniej jedno miejsce.'}</p>`;
    els.setActions.hidden = true;
    return;
  }
  els.setActions.hidden = false;
  els.set.innerHTML =
    (skipped ? '<p class="note warn">Partner pominięty – wpisz jego nazwę.</p>' : '') +
    `<p class="small count">Linków: ${currentRows.length}</p><ul class="rows">` +
    currentRows
      .map((r, i) => `
        <li>
          <div class="row-head"><b>${esc(r.channel)}</b> · ${esc(r.placement)}</div>
          <div class="link-box">
            <code class="link">${esc(r.link)}</code>
            <button type="button" class="btn sm" data-copy="${i}" aria-label="Kopiuj link: ${esc(r.channel)}, ${esc(r.placement)}">Kopiuj</button>
          </div>
        </li>`)
      .join('') +
    '</ul>';
}

/* ---------- Odświeżanie ---------- */
function render() {
  const base = inputs();
  renderNotes(base);
  if (state.mode === 'single') renderSingle(base);
  else renderSet(base);
  persist();
}

function setMode(mode) {
  state.mode = mode;
  const single = mode === 'single';
  $('tab-single').setAttribute('aria-selected', String(single));
  $('tab-set').setAttribute('aria-selected', String(!single));
  $('tab-single').tabIndex = single ? 0 : -1;
  $('tab-set').tabIndex = single ? -1 : 0;
  $('panel-single').hidden = !single;
  $('panel-set').hidden = single;
  render();
}

/* ---------- Ustawienia kanałów ---------- */
function saveChannels() {
  store.set(STORE.channels, channels);
  fillChannelSelect();
  renderPicker();
  render();
}

function renderEditor() {
  $('editor').innerHTML = channels
    .map((c, ci) => `
      <fieldset class="ed-channel" data-ci="${ci}">
        <legend class="visually-hidden">${esc(c.label)}</legend>
        <div class="ed-row">
          <label>Nazwa<input data-f="label" value="${esc(c.label)}"></label>
          <label>Kanał (utm_source)<input data-f="source" value="${esc(c.source)}" spellcheck="false"></label>
          <label class="ed-group">Grupa<select data-f="group">
            <option value="social" ${c.group === 'social' ? 'selected' : ''}>Social media</option>
            <option value="other" ${c.group !== 'social' ? 'selected' : ''}>Inne</option>
          </select></label>
          <button type="button" class="icon danger" data-del-channel="${ci}" aria-label="Usuń kanał ${esc(c.label)}">Usuń</button>
        </div>
        <ul class="ed-places">
          ${c.placements.map((p, pi) => `
            <li data-pi="${pi}">
              <label>Miejsce<input data-p="label" value="${esc(p.label)}"></label>
              <label>Wartość (utm_medium)<input data-p="medium" value="${esc(p.medium)}" spellcheck="false"></label>
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

/* ---------- Start ---------- */
function init() {
  // Domyślnie dzisiejsza data (RRMMDD) – za każdym otwarciem, żeby nie zostawała kampania z poprzedniego dnia.
  const today = todayCampaign();
  els.campaign.value = today.campaign;
  $('campaign-date').value = today.iso;
  fillChannelSelect();
  renderPicker();
  setupHelp();
  setupSettings();

  for (const el of [els.target, els.campaign, els.content, els.partner, els.partnerSet]) el.addEventListener('input', render);
  $('campaign-date').addEventListener('change', (e) => {
    const v = campaignFromDate(e.target.value);
    if (v) {
      els.campaign.value = v;
      render();
    }
  });
  els.channel.addEventListener('change', () => {
    state.channel = els.channel.value;
    state.placement = '';
    fillPlacementSelect();
    render();
  });
  els.placement.addEventListener('change', () => {
    state.placement = els.placement.value;
    render();
  });

  els.picker.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    if (e.target.checked) state.selected.add(e.target.value);
    else state.selected.delete(e.target.value);
    updatePartnerSetField();
    render();
  });
  document.querySelectorAll('[data-select]').forEach((b) =>
    b.addEventListener('click', () => {
      const mode = b.dataset.select;
      state.selected.clear();
      for (const c of channels) {
        for (const p of c.placements) {
          if (mode === 'all' || (mode === 'social' && c.group === 'social')) state.selected.add(key(c, p));
        }
      }
      renderPicker();
      render();
    }),
  );

  els.set.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copy(currentRows[Number(b.dataset.copy)].link, 'Link skopiowany');
  });
  $('copy-all').addEventListener('click', () => copy(toTsv(currentRows), `Skopiowano ${currentRows.length} linków`));
  $('download-csv').addEventListener('click', () => {
    const name = `utm-${slugify(els.campaign.value) || 'linki'}.csv`;
    download(name, toCsv(currentRows), 'text/csv;charset=utf-8');
  });

  // Strzałki w zakładkach (wzorzec ARIA tabs)
  document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = state.mode === 'single' ? 'set' : 'single';
      setMode(next);
      $(`tab-${next}`).focus();
    }
  });
  $('tab-single').addEventListener('click', () => setMode('single'));
  $('tab-set').addEventListener('click', () => setMode('set'));

  if (!state.selected.size) {
    for (const c of channels) if (c.group === 'social') for (const p of c.placements) state.selected.add(key(c, p));
    renderPicker();
  }
  setMode(state.mode);
}

init();
