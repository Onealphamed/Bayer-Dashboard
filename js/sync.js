// SYNC MODULE

// "Publish to web" CSV URL — works with public CORS, no backend needed.
// This is the LIVE "Bayer" tracker tab (gid 2007197158) of the working
// spreadsheet, auto-republished on every edit. To update: File → Share →
// Publish to web → select the data tab → CSV → copy URL here.
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZmHF8skx5_YbEUvccXG0l8_D8XelTNGV2RNauRsjJno__T2sQFBq_vv0VvyboREoi6sSJLwmNZKvi/pub?gid=2007197158&single=true&output=csv';

// Proper RFC-4180 CSV parser — handles commas and newlines inside quoted fields.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i+1];
    if (inQ) {
      if (ch === '"' && nx === '"') { field += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\r' && nx === '\n') { row.push(field.trim()); rows.push(row); row=[]; field=''; i++; }
      else if (ch === '\n' || ch === '\r') { row.push(field.trim()); rows.push(row); row=[]; field=''; }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows.filter(r => r.some(f => f));
}

function applySheetData(rows) {
  // Header-driven: locate the header row by content and map columns by NAME.
  // This is resilient to a leading blank column, a title row above the header,
  // and extra summary columns to the right (all present in the working tab).
  const norm = s => (s || '').toString().trim().toLowerCase();
  let hdrIdx = rows.findIndex(r =>
    r.some(c => norm(c) === 'date of event') || r.some(c => norm(c) === 'name of event'));
  if (hdrIdx < 0) hdrIdx = 0;
  const hdr = rows[hdrIdx].map(norm);
  const col = (...preds) => {
    for (const p of preds) { const i = hdr.findIndex(p); if (i >= 0) return i; }
    return -1;
  };

  const iNo = col(h => h === 'no' || h === 'sr. no.' || h === 'sr no');
  const iT  = col(h => h.includes('therapy'));
  const iE  = col(h => h.includes('name of event'), h => h.includes('event'));
  const iM  = col(h => h === 'month');                       // first "Month" = data col
  const iD  = col(h => h.includes('date of event'), h => h.includes('date'));
  const iR  = col(h => h.includes('report'));                // Report Sent / Report Submitted
  const iY  = col(h => h === 'type', h => h.includes('type'));
  const iA  = col(h => h.includes('attend'));
  const iK  = col(h => h.includes('kol'));

  console.log('Header row', hdrIdx, '| cols No:'+iNo, 'T:'+iT, 'E:'+iE, 'M:'+iM, 'D:'+iD, 'R:'+iR, 'Y:'+iY, 'A:'+iA, 'K:'+iK);
  if (iT < 0) { console.warn('Therapy column not found — aborting sheet apply'); return 0; }

  // A row counts as data when it names a therapy AND has a date (or month).
  // Deliberately NOT keyed off the "No" column: rows are often added without a
  // serial number, and those events must still be counted.
  const isDataRow = r => {
    const t = (r[iT] || '').toString().trim();
    if (!t || /^therapy/i.test(t)) return false;
    const when = (iD >= 0 ? (r[iD] || '').toString().trim() : '')
              || (iM >= 0 ? (r[iM] || '').toString().trim() : '');
    return !!when;
  };

  const parsed = rows
    .slice(hdrIdx + 1)
    .filter(isDataRow)
    .filter(r => r[iT] && r[iT].toString().trim())
    .map((r, i) => ({
      id: i + 1,
      therapy:    r[iT].toString().trim(),
      event:      iE >= 0 ? (r[iE] || '').toString().trim() : '',
      month:      iM >= 0 ? normalizeMonth((r[iM] || '').toString().trim()) : '',
      date:       iD >= 0 ? (r[iD] || '').toString().trim() : '',
      type:       (iY >= 0 ? (r[iY] || 'NSP').toString().trim() : 'NSP') || 'NSP',
      attendees:  iA >= 0 && r[iA] ? parseInt(r[iA]) || null : null,
      salesperson: null,
      reported:   iR >= 0 && (r[iR] || '').toString().toLowerCase() === 'yes',
      kols:       iK >= 0 && r[iK] ? parseKOLNames(r[iK].toString()) : [],
    }));
  RAW_DATA.length = 0;
  parsed.forEach(x => RAW_DATA.push(x));
  MONTH_ORDER = getSortedMonths(RAW_DATA);
  return parsed.length;
}

function setBanner(state, msg) {
  const banner = document.getElementById('syncBanner');
  const msgEl  = document.getElementById('syncMsg');
  banner.className = 'sync-banner';
  if (state === 'hide') { banner.classList.remove('show'); return; }
  banner.classList.add('show');
  if (state === 'error')   banner.classList.add('error');
  if (state === 'success') banner.classList.add('success');
  msgEl.textContent = msg;
  if (state === 'success') setTimeout(() => setBanner('hide'), 3000);
}

const CACHE_KEY     = 'bayer_data_cache';
const CACHE_TS_KEY  = 'bayer_data_ts';

// Save successfully synced data to localStorage
function saveToCache(rows) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch(e) { console.warn('Cache save failed:', e.message); }
}

// Load cached data — returns true if cache was applied
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts     = localStorage.getItem(CACHE_TS_KEY);
    if (!cached) return false;
    const rows = JSON.parse(cached);
    if (!Array.isArray(rows) || rows.length === 0) return false;
    RAW_DATA.length = 0;
    rows.forEach(x => RAW_DATA.push(x));
    MONTH_ORDER = getSortedMonths(RAW_DATA);
    const age = ts ? Math.round((Date.now() - parseInt(ts)) / 60000) : null;
    const badge = document.getElementById('lastUpdated');
    badge.textContent = `${rows.length} Webinars · Cached${age !== null ? ` · ${age}m ago` : ''}`;
    return true;
  } catch(e) {
    console.warn('Cache load failed:', e.message);
    return false;
  }
}

async function fetchCSVDirect() {
  const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // Sanity check: should look like CSV with known headers
  if (!text.includes('Therapy') && !text.includes('therapy') && !text.includes('Event') && !text.includes('event')) {
    throw new Error('Response does not look like sheet CSV');
  }
  return text;
}

async function fetchCSVProxy() {
  // Fallback: route through allorigins CORS proxy
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(SHEET_CSV_URL)}`;
  const res = await fetch(proxy, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const json = await res.json();
  if (!json.contents) throw new Error('Proxy returned empty contents');
  return json.contents;
}

async function syncFromSheets() {
  const badge = document.getElementById('lastUpdated');
  setBanner('loading', 'Connecting to Google Sheets…');
  let csvText = null;
  let lastErr = '';

  // Try direct fetch first (fastest, no latency)
  try { csvText = await fetchCSVDirect(); }
  catch (e) { lastErr = e.message; console.warn('Direct fetch failed:', e.message); }

  // Fallback to CORS proxy if direct failed
  if (!csvText) {
    try { csvText = await fetchCSVProxy(); }
    catch (e) { lastErr = e.message; console.warn('Proxy fetch failed:', e.message); }
  }

  if (!csvText) {
    setBanner('error', `⚠ Could not reach Google Sheets — showing cached/static data. (${lastErr})`);
    return;
  }

  try {
    const parsed = parseCSV(csvText);
    const count  = applySheetData(parsed);
    saveToCache([...RAW_DATA]); // persist to localStorage
    const ts = new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
    badge.textContent = `${count} Webinars · Live · ${ts}`;
    badge.style.background = 'rgba(120,190,32,0.2)';
    initFilters();
    refresh();
    setBanner('success', `✓ Live — ${count} webinars synced from Google Sheets at ${ts}`);
  } catch (e) {
    setBanner('error', `⚠ Sheet data parse error: ${e.message}`);
    console.warn('Sheet parse failed:', e.message);
  }
}
