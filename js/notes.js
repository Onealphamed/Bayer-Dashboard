// NOTES MODULE
// Meeting notes / action points, read live from a "Notes" tab in the Bayer
// spreadsheet. Columns (header row, any order): Date | Type | Point | Owner | Status.
//
// SETUP: once the "Notes" tab is published to web (File → Share → Publish to
// web → Notes → CSV), put its gid below. The gid is the number in that URL.
const NOTES_GID = ''; // <-- fill in with the published "Notes" tab gid
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
  let hi = rows.findIndex(r => r.some(c => { const n = norm(c); return n === 'point' || n.includes('point') || n.includes('note') || n.includes('discussion'); }));
  if (hi < 0) hi = 0;
  const hdr = rows[hi].map(norm);
  const col = (...preds) => { for (const p of preds) { const i = hdr.findIndex(p); if (i >= 0) return i; } return -1; };
  const iDate  = col(h => h.includes('date'));
  const iType  = col(h => h.includes('type') || h.includes('meeting') || h.includes('freq'));
  const iPoint = col(h => h === 'point' || h.includes('point') || h.includes('note') || h.includes('discussion') || h.includes('action') || h.includes('minute'));
  const iOwner = col(h => h.includes('owner') || h.includes('respons') || h.includes('assign') || h === 'by');
  const iStat  = col(h => h.includes('status') || h.includes('state'));

  return rows.slice(hi + 1)
    .map(r => ({
      date:   iDate  >= 0 ? (r[iDate]  || '').toString().trim() : '',
      type:   iType  >= 0 ? (r[iType]  || '').toString().trim() : '',
      point:  iPoint >= 0 ? (r[iPoint] || '').toString().trim() : '',
      owner:  iOwner >= 0 ? (r[iOwner] || '').toString().trim() : '',
      status: iStat  >= 0 ? (r[iStat]  || '').toString().trim() : '',
    }))
    .filter(n => n.point);
}

function renderNotes() {
  const host = document.getElementById('notesBody');
  if (!host) return;
  const cnt = document.getElementById('notesCount');
  if (cnt) cnt.textContent = `${notesData.length} note${notesData.length !== 1 ? 's' : ''}`;

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
  const t   = (n.type || '').toLowerCase();
  const tc  = t.startsWith('month') ? 'monthly' : (t.startsWith('week') ? 'weekly' : 'other');
  const sc  = statusClass(n.status);
  return `<div class="note-card ${sc}">
    <div class="note-head">
      <span class="note-type ${tc}">${esc(n.type || 'Note')}</span>
      <span class="note-date">${esc(fmtNoteDate(n.date))}</span>
      ${n.status ? `<span class="note-status ${sc}">${esc(n.status)}</span>` : ''}
    </div>
    <div class="note-point">${esc(n.point).replace(/\n/g, '<br>')}</div>
    ${n.owner ? `<div class="note-owner">👤 ${esc(n.owner)}</div>` : ''}
  </div>`;
}

function setNotesFilter(f, btn) {
  notesFilter = f;
  document.querySelectorAll('#notesFilters .filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNotes();
}

function renderNotesSetup(host) {
  host.innerHTML = `<div class="notes-setup">
    <div class="notes-setup-icon">🗒️</div>
    <h3>Meeting Notes — quick one-time setup</h3>
    <p>Add a tab named <b>Notes</b> to your Bayer spreadsheet with these column headers in row 1:</p>
    <div class="notes-setup-cols"><span>Date</span><span>Type</span><span>Point</span><span>Owner</span><span>Status</span></div>
    <ol>
      <li>In the Bayer sheet, create a new tab called <b>Notes</b>.</li>
      <li>Row&nbsp;1 headers: <b>Date · Type · Point · Owner · Status</b> &nbsp;(Type = Weekly / Monthly · Status = Open / Done).</li>
      <li>Add your weekly &amp; monthly meeting points as rows.</li>
      <li>File → Share → <b>Publish to web</b> → select the <b>Notes</b> tab → <b>CSV</b> → Publish.</li>
      <li>Send me the published link and I'll switch this on.</li>
    </ol>
    <div class="notes-setup-preview">
      <div class="notes-setup-preview-lbl">This is how each note will look:</div>
      <div class="note-card open">
        <div class="note-head">
          <span class="note-type weekly">Weekly</span>
          <span class="note-date">16 Jul 2026</span>
          <span class="note-status open">Open</span>
        </div>
        <div class="note-point">Follow up with KOLs on pending July webinar reports.</div>
        <div class="note-owner">👤 Linda</div>
      </div>
    </div>
  </div>`;
}
