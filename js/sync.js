// SYNC MODULE

// "Publish to web" CSV URL — works with public CORS, no backend needed.
// To update: File → Share → Publish to web → Sheet1 → CSV → copy URL here.
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYwkCYHxM0pGXyB6rh2-xiH_zpBkWrgx4s90SIs8yZpxvqvr-cYc_wP6omojYPKfgykiYNHOnwWrC1/pub?output=csv';

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
  // Sheet column layout (0-based). The sheet HAS a header row, which we skip below.
  // 0=No | 1=Therapy Area | 2=Name of Event | 3=Month | 4=Date of event |
  // 5=Invite Sent | 6=Report Sent | 7=Type | 8=No of attendees | 9=Name of KOLs
  const iT = 1;  // Therapy  (Onco / Opthal)
  const iE = 2;  // Event name
  const iM = 3;  // Month
  const iD = 4;  // Date
  const iR = 6;  // Reported = "Report Sent" (Yes/No)
  const iY = 7;  // Session type (NSP/ISP/Advisory)
  const iA = 8;  // Attendees
  const iK = 9;  // KOL / Speakers
  const iS = -1; // Salesperson — not in sheet

  console.log('Sheet row count:', rows.length, '| Sample row 0:', rows[0] ? rows[0].slice(0,10).join(' | ') : 'empty');

  const parsed = rows
    // Keep only real data rows: the "No" column must be a number. This drops the
    // header row and any stray/blank rows automatically.
    .filter(r => /^\d+$/.test((r[0] || '').toString().trim()))
    .filter(r => r[iT] && r[iT].toString().trim())
    .map((r, i) => ({
      id: i + 1,
      therapy:    r[iT].toString().trim(),
      event:      (r[iE] || '').toString().trim(),
      month:      normalizeMonth((r[iM] || '').toString().trim()),
      date:       (r[iD] || '').toString().trim(),
      type:       (r[iY] || 'NSP').toString().trim() || 'NSP',
      attendees:  r[iA] ? parseInt(r[iA]) || null : null,
      salesperson: null,
      reported:   (r[iR] || '').toString().toLowerCase() === 'yes',
      kols:       r[iK] ? parseKOLNames(r[iK].toString()) : [],
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
