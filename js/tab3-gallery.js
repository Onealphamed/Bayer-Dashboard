// TAB3 GALLERY MODULE
// Driven by the master doctor list (GALLERY_DATA, generated from the master
// sheet + Drive photo folder). Webinar data (RAW_DATA) is cross-referenced
// only to show each doctor's session count where they were a speaker.

let galleryOncoAll    = [];
let galleryOpthalAll  = [];
let galleryOncoShown   = 12;
let galleryOpthalShown = 12;

// Normalise a name to a stable key (lowercase, drop Dr/Prof, punctuation).
// Mirrors the normaliser used to build the photo map.
function gNorm(s) {
  return ('' + (s || ''))
    .toLowerCase()
    .replace(/\bprof\.?/g, '')
    .replace(/\bdr\.?/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s) {
  return ('' + (s || '')).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function drivePhotoURL(id) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w400-h400`;
}

function avatarURL(name, therapy) {
  const bg = therapy === 'Onco' ? '003A8F' : '2D7D2D';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=ffffff&size=200&bold=true&rounded=true`;
}

function speakerCardHTML(kol) {
  const isOnco    = kol.therapy === 'Onco';
  const bodyClass = isOnco ? '' : ' opthal';
  const wrapClass = isOnco ? 'onco' : 'opthal';
  const isSpeaker = kol.sessions > 0;
  const roleLabel = isSpeaker
    ? (kol.isp > 0 ? 'ISP Speaker' : 'National Speaker')
    : (isOnco ? 'Oncology KOL' : 'Ophthalmology KOL');
  const photo  = kol.photoUrl || avatarURL(kol.name, kol.therapy);
  const avatar = avatarURL(kol.name, kol.therapy);
  const credText = kol.credential || (isSpeaker ? `${kol.sessions} webinar${kol.sessions > 1 ? 's' : ''}` : '');
  const badge = isSpeaker
    ? `<span class="spk-sessions-badge">${kol.sessions} session${kol.sessions > 1 ? 's' : ''}</span>`
    : '';
  return `<div class="spk-card">
    <div class="spk-photo-wrap ${wrapClass}">
      <img class="spk-avatar" src="${photo}" alt="${esc(kol.name)}" loading="lazy"
           onerror="this.onerror=null;this.src='${avatar}'"/>
      ${badge}
    </div>
    <div class="spk-body${bodyClass}">
      <div class="spk-role">${roleLabel}</div>
      <div class="spk-name">${esc(kol.name)}</div>
      <div class="spk-cred">${esc(credText)}</div>
    </div>
  </div>`;
}

// Count webinar sessions per speaker (from RAW_DATA), keyed by normalised name.
function buildSessionIndex() {
  const idx = {};
  (typeof RAW_DATA !== 'undefined' ? RAW_DATA : []).forEach(r => {
    (r.kols || []).forEach(nm => {
      const k = gNorm(nm);
      if (!k) return;
      if (!idx[k]) idx[k] = { sessions: 0, isp: 0, nsp: 0 };
      idx[k].sessions++;
      const t = (r.type || '').toLowerCase();
      if (t === 'isp') idx[k].isp++; else if (t === 'nsp') idx[k].nsp++;
    });
  });
  return idx;
}

function buildGalleryData() {
  const sidx = buildSessionIndex();
  const src  = (typeof GALLERY_DATA !== 'undefined') ? GALLERY_DATA : [];
  const list = src.map(d => {
    const s = sidx[gNorm(d.n)] || { sessions: 0, isp: 0, nsp: 0 };
    return {
      name:       d.n,
      therapy:    d.s === 'Opthal' ? 'Opthal' : 'Onco',
      credential: d.c || '',
      photoUrl:   d.p ? drivePhotoURL(d.p) : null,
      sessions:   s.sessions,
      isp:        s.isp,
      nsp:        s.nsp,
    };
  });

  // Surface doctors with photos first, then active speakers, then the rest.
  function pr(k) {
    let v = 0;
    if (k.photoUrl)     v += 2;
    if (k.sessions > 0) v += 1;
    return v;
  }
  list.sort((a, b) => (pr(b) - pr(a)) || (b.sessions - a.sessions) || a.name.localeCompare(b.name));

  galleryOncoAll   = list.filter(k => k.therapy === 'Onco');
  galleryOpthalAll = list.filter(k => k.therapy === 'Opthal');
}

function renderGallery() {
  const oncoGrid   = document.getElementById('galleryOncoGrid');
  const opthalGrid = document.getElementById('galleryOpthalGrid');
  if (!oncoGrid || !opthalGrid) return;

  buildGalleryData();

  const oncoSlice   = galleryOncoAll.slice(0, galleryOncoShown);
  const opthalSlice = galleryOpthalAll.slice(0, galleryOpthalShown);

  oncoGrid.innerHTML   = oncoSlice.length   ? oncoSlice.map(speakerCardHTML).join('')   : '<div class="gallery-no-results">No Oncology doctors found</div>';
  opthalGrid.innerHTML = opthalSlice.length ? opthalSlice.map(speakerCardHTML).join('') : '<div class="gallery-no-results">No Ophthalmology doctors found</div>';

  const oncoWithPhoto   = galleryOncoAll.filter(k => k.photoUrl).length;
  const opthalWithPhoto = galleryOpthalAll.filter(k => k.photoUrl).length;
  document.getElementById('galleryOncoCount').textContent   = `${galleryOncoAll.length} doctors · ${oncoWithPhoto} with photos`;
  document.getElementById('galleryOpthalCount').textContent = `${galleryOpthalAll.length} doctors · ${opthalWithPhoto} with photos`;

  const om = document.getElementById('galleryOncoMore');
  const pm = document.getElementById('galleryOpthalMore');
  if (om) {
    om.style.display = galleryOncoAll.length > galleryOncoShown ? 'block' : 'none';
    om.textContent = `Show More Oncology (${galleryOncoAll.length - galleryOncoShown} more)`;
  }
  if (pm) {
    pm.style.display = galleryOpthalAll.length > galleryOpthalShown ? 'block' : 'none';
    pm.textContent = `Show More Ophthalmology (${galleryOpthalAll.length - galleryOpthalShown} more)`;
  }
}

function showMoreGallery(therapy) {
  if (therapy === 'Onco') galleryOncoShown += 12; else galleryOpthalShown += 12;
  renderGallery();
}

// fetchCredentials is retained as a no-op so existing callers (app.js) keep
// working; credentials now come baked into GALLERY_DATA, no live fetch needed.
function fetchCredentials() {}

let gallerySearchTimer = null;
function onGallerySearch(val) {
  const clear       = document.getElementById('gallerySearchClear');
  const defaultView = document.getElementById('galleryDefault');
  const searchView  = document.getElementById('gallerySearchResults');
  if (clear) clear.style.display = val ? 'block' : 'none';
  clearTimeout(gallerySearchTimer);
  gallerySearchTimer = setTimeout(() => {
    if (!val.trim()) { defaultView.style.display = ''; searchView.style.display = 'none'; return; }
    if (!galleryOncoAll.length && !galleryOpthalAll.length) buildGalleryData();
    const q = val.trim().toLowerCase();
    const all = [...galleryOncoAll, ...galleryOpthalAll];
    const results = all.filter(k => k.name.toLowerCase().includes(q));
    document.getElementById('galleryResultGrid').innerHTML = results.length
      ? results.map(speakerCardHTML).join('')
      : `<div class="gallery-no-results">No doctors found for "${esc(val)}"</div>`;
    document.getElementById('galleryResultCount').textContent = results.length + ' found';
    defaultView.style.display = 'none';
    searchView.style.display  = '';
  }, 200);
}

function clearGallerySearch() {
  const inp = document.getElementById('gallerySearch');
  inp.value = ''; onGallerySearch(''); inp.focus();
}
