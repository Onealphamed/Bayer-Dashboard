// TAB3 GALLERY MODULE

let galleryOncoAll   = [];
let galleryOpthalAll = [];
let galleryOncoShown  = 10;
let galleryOpthalShown = 10;

function parseCSVRows(text) {
  return text.trim().split('\n').map(r => {
    const out = []; let cur = '', inQ = false;
    for (let i = 0; i < r.length; i++) {
      const c = r[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    out.push(cur.trim());
    return out;
  });
}

async function fetchCredentials() {
  let csvText = null;

  // Try direct fetch first, then CORS proxy fallback
  try {
    const res = await fetch(SHEET2_URL, { cache: 'no-store' });
    if (res.ok) csvText = await res.text();
  } catch(e) { console.warn('Cred direct fetch failed:', e.message); }

  if (!csvText) {
    try {
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(SHEET2_URL)}`;
      const res   = await fetch(proxy, { cache: 'no-store' });
      if (res.ok) { const j = await res.json(); csvText = j.contents; }
    } catch(e) { console.warn('Cred proxy fetch failed:', e.message); }
  }

  if (!csvText) { console.warn('Could not load credentials sheet'); return; }

  const rows = parseCSVRows(csvText);
  if (rows.length < 2) return;

  const hdr  = rows[0].map(h => h.toLowerCase().trim());
  console.log('Credentials sheet headers:', hdr);

  // Column: Sr.No | Name of the KOL | Credentials | (optional) Photo Link
  const iN = hdr.findIndex(h => h.includes('name') || h.includes('kol') || h.includes('doctor'));
  const iC = hdr.findIndex(h => h.includes('credential') || h.includes('qualif') || h.includes('degree') || h.includes('desig'));
  const iH = hdr.findIndex(h => h.includes('hospital') || h.includes('institute') || h.includes('affil'));
  const iP = hdr.findIndex(h => h.includes('photo') || h.includes('image') || h.includes('pic') || h.includes('drive') || h.includes('link'));

  console.log('Cred cols → name:', iN, 'cred:', iC, 'hosp:', iH, 'photo:', iP);
  if (iN < 0) { console.warn('Name column not found in sheet'); return; }

  let found = 0, photosFound = 0;
  rows.slice(1).forEach(row => {
    const name = (row[iN] || '').toString().trim();
    if (!name || name.match(/^\d+$/)) return;
    const key = name.toLowerCase();

    // Photo link → Drive thumbnail. Don't overwrite an existing (hardcoded) photo.
    if (iP >= 0 && !(drivePhotoMap[key] && drivePhotoMap[key].photoUrl)) {
      const pid = driveIdFromLink(row[iP]);
      if (pid) {
        drivePhotoMap[key] = { name, photoUrl: drivePhotoURL(pid) };
        photosFound++;
      }
    }

    // Credentials. Don't overwrite hardcoded credentials — they're pre-formatted.
    if (iC >= 0) {
      const cred = (row[iC] || '').toString().trim();
      if (cred && !(credentialsMap[key] && credentialsMap[key].credential)) {
        credentialsMap[key] = { credential: cred, hospital: iH >= 0 ? (row[iH] || '').toString().trim() : '' };
        found++;
      }
    }
  });

  console.log(`Credentials loaded: ${found} · Photos loaded from sheet: ${photosFound}`);
  if (found > 0 || photosFound > 0) renderGallery(); // re-render now that data is populated
}

function lookupCred(name) {
  const clean = s => s.toLowerCase().replace(/dr\.?\s*/i,'').trim();
  const cn = clean(name);
  for (const key in credentialsMap) {
    const ck = clean(key);
    if (ck.includes(cn.slice(0,8)) || cn.includes(ck.slice(0,8)))
      return credentialsMap[key];
  }
  return null;
}

// Strict name match: require 2+ significant words to match (prevents cross-person false positives)
// e.g. "Dr Lakshmi Sandhya" must NOT match "Dr Lakshmi Prasanna S" (only 1 word matches)
function nameMatch(a, b) {
  const clean = s => s.toLowerCase()
    .replace(/\bdr\.?\s*/i,'').replace(/\bprof\.?\s*/i,'')
    .replace(/\s+/g,' ').trim();
  const ca = clean(a), cb = clean(b);
  if (ca === cb) return true;
  const sig = w => w.length > 1;
  const wA = ca.split(' ').filter(sig);
  const wB = cb.split(' ').filter(sig);
  if (!wA.length || !wB.length) return false;
  const hits = wA.filter(w => wB.includes(w)).length;
  return hits >= Math.min(2, Math.min(wA.length, wB.length));
}

function findPhoto(name) {
  for (const key in drivePhotoMap) {
    if (nameMatch(name, key)) return drivePhotoMap[key].photoUrl;
  }
  return null;
}

// Extract a Google Drive file ID from any common link format (or a bare ID),
// so users can paste whatever Drive gives them into the sheet's photo column:
//   https://drive.google.com/file/d/<ID>/view?usp=sharing
//   https://drive.google.com/open?id=<ID>   ·   .../uc?id=<ID>   ·   .../thumbnail?id=<ID>
//   <ID>            (the bare id on its own)
function driveIdFromLink(link) {
  if (!link) return null;
  const s = link.toString().trim();
  if (!s) return null;
  const m = s.match(/\/file\/d\/([A-Za-z0-9_-]{20,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s; // bare id pasted directly
  return null;
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
  const roleLabel = kol.isp > 0 ? 'ISP Speaker' : 'National Speaker';
  const photo     = kol.photoUrl || avatarURL(kol.name, kol.therapy);
  const sessionTag = `${kol.isp > 0 ? 'ISP' : 'NSP'} · ${kol.sessions} session${kol.sessions>1?'s':''}`;
  const credText = kol.credential || sessionTag;
  return `<div class="spk-card">
    <div class="spk-photo-wrap ${wrapClass}">
      <img class="spk-avatar" src="${photo}" alt="${kol.name}" loading="lazy"
           onerror="this.src='${avatarURL(kol.name, kol.therapy)}'"/>
      <span class="spk-sessions-badge">${kol.sessions} session${kol.sessions>1?'s':''}</span>
    </div>
    <div class="spk-body${bodyClass}">
      <div class="spk-role">${roleLabel}</div>
      <div class="spk-name">${kol.name}</div>
      <div class="spk-cred">${credText}</div>
    </div>
  </div>`;
}

function buildGalleryData() {
  const map = {};  // canonical-key → entry

  // Find existing map entry by fuzzy name match
  function findEntry(name) {
    for (const k in map) {
      if (nameMatch(name, map[k].name)) return k;
    }
    return null;
  }

  RAW_DATA.forEach(row => {
    (row.kols || []).forEach(name => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const existing = findEntry(trimmed);
      if (existing) {
        // Merge into existing entry — same person, different name spelling
        map[existing].sessions++;
        const tl = (row.type||'').toLowerCase();
        if (tl==='nsp') map[existing].nsp++; else if (tl==='isp') map[existing].isp++;
      } else {
        const key  = trimmed.toLowerCase();
        const cred = lookupCred(trimmed);
        map[key] = { name: trimmed, therapy: row.therapy, nsp:0, isp:0, sessions:0, photoUrl: null,
          credential: cred ? cred.credential : '',
          hospital:   cred ? cred.hospital   : '' };
        map[key].sessions++;
        const tl = (row.type||'').toLowerCase();
        if (tl==='nsp') map[key].nsp++; else if (tl==='isp') map[key].isp++;
      }
    });
  });
  // Attach Drive photos
  Object.values(map).forEach(k => { k.photoUrl = findPhoto(k.name); });

  // Priority: photo+credential first, then photo only, then credential only, then rest
  function spkPriority(k) {
    if (k.photoUrl && k.credential) return 3;
    if (k.photoUrl)                 return 2;
    if (k.credential)               return 1;
    return 0;
  }
  const all = Object.values(map).sort((a, b) => {
    const diff = spkPriority(b) - spkPriority(a);
    return diff !== 0 ? diff : b.sessions - a.sessions;
  });
  galleryOncoAll   = all.filter(k => k.therapy === 'Onco');
  galleryOpthalAll = all.filter(k => k.therapy === 'Opthal');
}

function renderGallery() {
  const oncoGrid   = document.getElementById('galleryOncoGrid');
  const opthalGrid = document.getElementById('galleryOpthalGrid');

  buildGalleryData();

  const oncoSlice   = galleryOncoAll.slice(0, galleryOncoShown);
  const opthalSlice = galleryOpthalAll.slice(0, galleryOpthalShown);

  oncoGrid.innerHTML   = oncoSlice.length   ? oncoSlice.map(speakerCardHTML).join('')   : '<div class="gallery-no-results">No Oncology speakers found</div>';
  opthalGrid.innerHTML = opthalSlice.length ? opthalSlice.map(speakerCardHTML).join('') : '<div class="gallery-no-results">No Ophthalmology speakers found</div>';

  const oncoWithPhoto   = galleryOncoAll.filter(k => k.photoUrl).length;
  const opthalWithPhoto = galleryOpthalAll.filter(k => k.photoUrl).length;
  document.getElementById('galleryOncoCount').textContent   = `${galleryOncoAll.length} speakers · ${oncoWithPhoto} with photos`;
  document.getElementById('galleryOpthalCount').textContent = `${galleryOpthalAll.length} speakers · ${opthalWithPhoto} with photos`;

  const om = document.getElementById('galleryOncoMore');
  const pm = document.getElementById('galleryOpthalMore');
  om.style.display = galleryOncoAll.length   > galleryOncoShown   ? 'block' : 'none';
  pm.style.display = galleryOpthalAll.length > galleryOpthalShown ? 'block' : 'none';
  om.textContent = `Show More Oncology (${galleryOncoAll.length - galleryOncoShown} more)`;
  pm.textContent = `Show More Ophthalmology (${galleryOpthalAll.length - galleryOpthalShown} more)`;
}

function showMoreGallery(therapy) {
  if (therapy === 'Onco') galleryOncoShown += 10; else galleryOpthalShown += 10;
  renderGallery();
}

let gallerySearchTimer = null;
function onGallerySearch(val) {
  const clear       = document.getElementById('gallerySearchClear');
  const defaultView = document.getElementById('galleryDefault');
  const searchView  = document.getElementById('gallerySearchResults');
  clear.style.display = val ? 'block' : 'none';
  clearTimeout(gallerySearchTimer);
  gallerySearchTimer = setTimeout(() => {
    if (!val.trim()) { defaultView.style.display=''; searchView.style.display='none'; return; }
    const q = val.trim().toLowerCase();
    const all = [...galleryOncoAll, ...galleryOpthalAll];
    const results = all.filter(k => k.name.toLowerCase().includes(q));
    document.getElementById('galleryResultGrid').innerHTML = results.length
      ? results.map(speakerCardHTML).join('')
      : `<div class="gallery-no-results">No speakers found for "${val}"</div>`;
    document.getElementById('galleryResultCount').textContent = results.length + ' found';
    defaultView.style.display = 'none';
    searchView.style.display  = '';
  }, 200);
}

function clearGallerySearch() {
  const inp = document.getElementById('gallerySearch');
  inp.value = ''; onGallerySearch(''); inp.focus();
}
