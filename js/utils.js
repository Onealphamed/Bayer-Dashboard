// UTILS MODULE

// ── Math + number formatting helpers ──
// (Restored: these were lost when index.html was split into modules,
//  which crashed renderKPIs() on boot and left the dashboard blank.)
function sum(arr) {
  return (arr || []).reduce((a, b) => a + (Number(b) || 0), 0);
}
function avg(arr) {
  const nums = (arr || []).filter(v => v !== null && v !== '' && !isNaN(v)).map(Number);
  return nums.length ? sum(nums) / nums.length : 0;
}
// Percentage change of curr vs prev, rounded to whole number.
function pct(curr, prev) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}
// Format a number with thousands separators; optional fixed decimals.
function fmt(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseDateLoose(str) {
  if (!str) return null;
  let d = new Date(str);
  if (!isNaN(d)) return d;
  // Handle "4-Sept-2025", "30-Sept-2025" etc.
  d = new Date(str.replace(/(\d{1,2})[-\/]([A-Za-z]+)[-\/](\d{4})/, '$2 $1 $3'));
  if (!isNaN(d)) return d;
  return null;
}

const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Normalise any month string to full name: "feb" / "FEB" / "February" → "February"
function normalizeMonth(raw) {
  if (!raw) return '';
  const s = raw.toString().trim().toLowerCase().slice(0, 3);
  return MONTH_FULL.find(m => m.toLowerCase().startsWith(s)) || raw.trim();
}

// Returns months sorted by their earliest date within the given dataset.
// Months whose dates can't be parsed are still included, sorted by calendar order.
function getSortedMonths(data) {
  const earliest = {};
  data.forEach(d => {
    if (!d.month) return;
    const mn = normalizeMonth(d.month);
    const dt = parseDateLoose(d.date);
    if (!earliest[mn] || (dt && dt < earliest[mn])) {
      // Use parsed date if available; fallback to a synthetic date by calendar order
      earliest[mn] = dt || new Date(2000, MONTH_FULL.indexOf(mn), 1);
    }
  });
  return Object.keys(earliest).sort((a, b) => earliest[a] - earliest[b]);
}

// Chronological month+year buckets, e.g. [{key:'July 2026', month:'July', year:2026}].
// Charts use these so the same month in different years is never merged into
// one bar/point (July 2025 and July 2026 stay separate).
function getMonthYearBuckets(data) {
  const map = {};
  data.forEach(d => {
    const m = normalizeMonth(d.month);
    const y = getYear(d);
    if (!m || !y) return;
    const key = m + ' ' + y;
    if (!map[key]) {
      map[key] = { key, month: m, year: y, sort: new Date(y, MONTH_FULL.indexOf(m), 1).getTime() };
    }
  });
  return Object.values(map).sort((a, b) => a.sort - b.sort);
}

// Short axis label: "Jul" when the data covers a single year, "Jul '26" across years.
function bucketLabel(b, multiYear) {
  return multiYear ? `${b.month.slice(0, 3)} '${String(b.year).slice(2)}` : b.month.slice(0, 3);
}

const COLORS = {
  onco:'#003A8F', opthal:'#78BE20',
  oncoAlpha:'rgba(0,58,143,0.10)', opthalAlpha:'rgba(120,190,32,0.10)',
  oncoMid:'rgba(0,58,143,0.6)', opthalMid:'rgba(120,190,32,0.6)'
};

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

function parseKOLNames(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(/[,;\/\n]+/)
    .map(n => toTitleCase(n.trim().replace(/\s+/g, ' ')))
    .filter(n => n.length > 1);
}

// Normalise a display name to a stable key for dedup (first + last word, lowercase)
function kolKey(name) {
  const parts = name.trim().toLowerCase().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[parts.length - 1];
}
