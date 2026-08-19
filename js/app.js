// APP MODULE

function toggleDark() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('bayer_dark', isDark ? '1' : '0');
  document.getElementById('darkToggle').textContent = isDark ? '☀️' : '🌙';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB SWITCHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'gallery') { renderGallery(); fetchCredentials(); }
  if (tab === 'notes')   { fetchNotes(); }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REFRESH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateHeaderSub() {
  if (!RAW_DATA.length) return;
  // Find actual earliest and latest records by parsed date
  let firstRec = null, lastRec = null, firstDt = null, lastDt = null;
  RAW_DATA.forEach(d => {
    const dt = parseDateLoose(d.date);
    if (!dt) return;
    if (!firstDt || dt < firstDt) { firstDt = dt; firstRec = d; }
    if (!lastDt  || dt > lastDt)  { lastDt  = dt; lastRec  = d; }
  });
  if (!firstRec || !lastRec) return;
  const first = normalizeMonth(firstRec.month);
  const last  = normalizeMonth(lastRec.month);
  const fy = getYear(firstRec) || '';
  const ly = getYear(lastRec)  || '';
  const sub = document.getElementById('headerSub');
  if (sub) sub.textContent = `CME Tracker · ${first.slice(0,3)} ${fy} – ${last.slice(0,3)} ${ly}`;
}

function refresh() {
  currentData = filt(RAW_DATA);
  updateHeaderSub();
  renderKPIs();
  renderTargets();
  renderCharts();
  renderYearVsYear();
  renderInsights();
  renderTable();
  renderKOLs();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOOT
// Priority: 1) localStorage cache  2) static RAW_DATA  3) live sheet sync
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('darkToggle').textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';

const cacheLoaded = loadFromCache(); // try localStorage first
if (!cacheLoaded) {
  MONTH_ORDER = getSortedMonths(RAW_DATA); // fall back to static data
}
initFilters();
refresh();                      // render immediately (cache or static)
syncFromSheets();               // always fetch latest from sheet in background
setInterval(syncFromSheets, 5 * 60 * 1000); // re-sync every 5 minutes
