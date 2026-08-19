// NOTES MODULE
// Meeting notes / action points, read live from a "Notes" tab in the Bayer
// spreadsheet. Columns are matched by header name (any order) — all optional:
//   Point/Actionable/Note · Date · Owner · Timeline/Due · Type · Status
const NOTES_GID = '1012051985';
const NOTES_CSV_URL = NOTES_GID
  ? `https://docs.google.com/spreadsheets/d/e/2PACX-1vTZmHF8skx5_YbEUvccXG0l8_D8XelTNGV2RNauRsjJno__T2sQFBq_vv0VvyboREoi6sSJLwmNZKvi/pub?gid=${NOTES_GID}&single=true&output=csv`
  : '';

let notesData   = [];
let notesFilter = 'all';

function fmtNoteDate(raw) {
  const d = parseDateLoose(raw);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
           : (raw || '').toString().trim();
}
function noteSortVal(n) { const d = parseDateLoose(n.date); return d ? d.getTime() : 0; }

function statusClass(s) {
  const t = (s || '').toLowerCase();
  if (/(done|closed|complete|resolved)/.test(t)) return 'done';
  if (/(open|pending|wip|progress|todo|hold)/.test(t)) return 'open';
  return 'na';
}

async function fetchNotes() {
  const host = document.getElementById('notesBody');
  if (!host) return;
  if (!NOTES_CSV_URL) { renderNotesSetup(host); return; }
  if (!notesData.length) host.innerHTML = '<div class="notes-empty">Loading meeting notes…</div>';

  let csv = null;
  try { const r = await fetch(NOTES_CSV_URL, { cache: 'no-store' }); if (r.ok) csv = await r.text(); }
  catch (e) { console.warn('Notes direct fetch failed:', e.message); }
  if (!csv) {
    try {
      const pr = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(NOTES_CSV_URL)}`, { cache: 'no-store' });
      if (pr.ok) { const j = await pr.json(); csv = j.contents; }
    } catch (e) { console.warn('Notes proxy fetch failed:', e.message); }
  }
  if (!csv) { host.innerHTML = '<div class="notes-empty">⚠ Could not load notes — check the Notes tab is published to the web.</div>'; return; }

  notesData = parseNotes(csv);
  renderNotes();
}

function parseNotes(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const norm = s => (s || '').toString().trim().toLowerCase();
  // Find the header row (contains a "point"-like or "actionable" column).
  let hi = rows.findIndex(r => r.some(c => {
    const n = norm(c);
    return n === 'point' || n.includes('point') || n.includes('action') || n.includes('note') || n.includes('discussion');
  }));
  if (hi < 0) hi = 0;
  const hdr = rows[hi].map(norm);
  const col = (...preds) => { for (const p of preds) { const i = hdr.findIndex(p); if (i >= 0) return i; } return -1; };
  const iPoint = col(h => h === 'point' || h.includes('point') || h.includes('action') || h.includes('note') || h.includes('discussion') || h.includes('minute'));
  const iDate  = col(h => h.includes('date'));
  const iOwner = col(h => h.includes('owner') || h.includes('respons') || h.includes('assign') || h === 'by');
  const iTime  = col(h => h.includes('timeline') || h.includes('deadline') || h.includes('due') || h.includes('eta') || h.includes('target'));
  const iType  = col(h => h.includes('type') || h.includes('meeting') || h.includes('freq'));
  const iStat  = col(h => h.includes('status') || h.includes('state'));

  const get = (r, i) => i >= 0 ? (r[i] || '').toString().trim() : '';
  return rows.slice(hi + 1)
    .map(r => ({
      point:    get(r, iPoint),
      date:     get(r, iDate),
      owner:    get(r, iOwner),
      timeline: get(r, iTime),
      type:     get(r, iType),
      status:   get(r, iStat),
    }))
    .filter(n => n.point);
}

function buildNotesFilters() {
  const bar = document.getElementById('notesFilters');
  if (!bar) return;
  const hasType   = notesData.some(n => n.type);
  const hasStatus = notesData.some(n => n.status);
  const chips = [['all', 'All']];
  if (hasType)   chips.push(['week', 'Weekly'], ['month', 'Monthly']);
  if (hasStatus) chips.push(['open', 'Open']);
  if (chips.length === 1) { bar.style.display = 'none'; return; }   // nothing worth filtering
  if (!chips.some(c => c[0] === notesFilter)) notesFilter = 'all';
  bar.style.display = '';
  bar.innerHTML = chips.map(c =>
    `<button class="filter-chip${c[0] === notesFilter ? ' active' : ''}" onclick="setNotesFilter('${c[0]}')">${c[1]}</button>`
  ).join('');
}

function renderNotes() {
  const host = document.getElementById('notesBody');
  if (!host) return;
  const cnt = document.getElementById('notesCount');
  if (cnt) cnt.textContent = `${notesData.length} note${notesData.length !== 1 ? 's' : ''}`;
  buildNotesFilters();

  if (!notesData.length) {
    host.innerHTML = '<div class="notes-empty">No meeting notes yet — add rows to the <b>Notes</b> tab (Actionable · Date · Owner · Timeline) and they\'ll appear here within a few minutes.</div>';
    return;
  }

  const sorted = [...notesData].sort((a, b) => noteSortVal(b) - noteSortVal(a));
  const f = notesFilter;
  const shown = sorted.filter(n => {
    if (f === 'all')  return true;
    if (f === 'open') return statusClass(n.status) === 'open' || !n.status;
    return (n.type || '').toLowerCase().startsWith(f);
  });

  host.innerHTML = shown.length
    ? shown.map(noteCardHTML).join('')
    : '<div class="notes-empty">No notes match this filter.</div>';
}

function noteCardHTML(n) {
  const t  = (n.type || '').toLowerCase();
  const tc = t.startsWith('month') ? 'monthly' : (t.startsWith('week') ? 'weekly' : 'other');
  const sc = statusClass(n.status);
  const head = [
    n.type   ? `<span class="note-type ${tc}">${esc(n.type)}</span>` : '',
    n.date   ? `<span class="note-date">${esc(fmtNoteDate(n.date))}</span>` : '',
    n.status ? `<span class="note-status ${sc}">${esc(n.status)}</span>` : '',
  ].join('');
  const foot = [
    n.owner    ? `<span class="note-owner">👤 ${esc(n.owner)}</span>` : '',
    n.timeline ? `<span class="note-timeline">⏳ ${esc(n.timeline)}</span>` : '',
  ].join('');
  return `<div class="note-card ${sc}">
    ${head ? `<div class="note-head">${head}</div>` : ''}
    <div class="note-point">${esc(n.point).replace(/\n/g, '<br>')}</div>
    ${foot ? `<div class="note-foot">${foot}</div>` : ''}
  </div>`;
}

function setNotesFilter(f) { notesFilter = f; renderNotes(); }

function renderNotesSetup(host) {
  host.innerHTML = `<div class="notes-setup">
    <div class="notes-setup-icon">🗒️</div>
    <h3>Meeting Notes — quick one-time setup</h3>
    <p>Add a tab named <b>Notes</b> to your Bayer spreadsheet, give it column headers, then publish it (File → Share → Publish to web → Notes → CSV) and send me the link.</p>
  </div>`;
}
