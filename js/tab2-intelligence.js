// TAB2 INTELLIGENCE MODULE

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KOL HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
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

function buildKOLMap(data) {
  const map = {}; // key -> { name, sessions:[], therapy:Set, types:Set }
  data.forEach(row => {
    const names = Array.isArray(row.kols) ? row.kols : [];
    names.forEach(raw => {
      const k = kolKey(raw);
      if (!k) return;
      if (!map[k]) map[k] = { name: raw, sessions: [], therapies: new Set(), types: new Set() };
      map[k].sessions.push(row);
      map[k].therapies.add(row.therapy);
      map[k].types.add(row.type);
      // prefer longer/better capitalised name
      if (raw.length > map[k].name.length) map[k].name = raw;
    });
  });
  return Object.values(map);
}

function kolAvatarColor(name, alpha) {
  const palette = ['#003A8F','#78BE20','#7C3AED','#D97706','#DC2626','#0891B2','#059669'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[p.length-1][0]||'')).toUpperCase();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RENDER KOLs TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderKOLs() {
  const allKols = buildKOLMap(RAW_DATA);
  const totalUnique = allKols.length;

  if (totalUnique === 0) {
    ['kolStatGrid','kolSplitBar','kolTherapyMix','kolTopList','kolIspList','kolNspList'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="kol-empty">No KOL data yet — add speaker names to the Google Sheet.</div>';
    });
    destroyChart('chartKolMonthly');
    return;
  }

  // Aggregate counts
  const ispKols = buildKOLMap(RAW_DATA.filter(r => r.type === 'ISP'));
  const nspKols = buildKOLMap(RAW_DATA.filter(r => r.type === 'NSP'));
  const oncoKols = buildKOLMap(RAW_DATA.filter(r => r.therapy === 'Onco'));
  const opthKols = buildKOLMap(RAW_DATA.filter(r => r.therapy === 'Opthal'));
  const repeatKols = allKols.filter(k => k.sessions.length > 1);
  const totalSessions = allKols.reduce((s, k) => s + k.sessions.length, 0);

  // ── STAT CARDS ──
  const statGrid = document.getElementById('kolStatGrid');
  statGrid.innerHTML = [
    { label:'Total Unique KOLs', val: totalUnique, sub:'Distinct speakers engaged', cls:'', icon:'🎤' },
    { label:'ISP KOLs', val: ispKols.length, sub:'In ISP sessions', cls:'green', icon:'⭐' },
    { label:'NSP KOLs', val: nspKols.length, sub:'In NSP sessions', cls:'', icon:'📣' },
    { label:'Repeat Speakers', val: repeatKols.length, sub:'Engaged 2+ times', cls:'purple', icon:'🔁' },
  ].map(s => `
    <div class="kol-stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="kol-stat-label">${s.label}</div>
        <span style="font-size:18px;opacity:.45">${s.icon}</span>
      </div>
      <div class="kol-stat-val ${s.cls}">${s.val}</div>
      <div class="kol-stat-sub">${s.sub}</div>
    </div>`).join('');

  // ── SESSION TYPE SPLIT BAR ──
  const ispPct = totalUnique ? Math.round(ispKols.length / totalUnique * 100) : 0;
  const nspPct = 100 - ispPct;
  document.getElementById('kolSplitBar').innerHTML = `
    <div class="kol-split-bar" style="margin-bottom:12px">
      <div class="kol-split-seg" style="width:${ispPct}%;background:#003A8F"></div>
      <div class="kol-split-seg" style="width:${nspPct}%;background:#78BE20"></div>
    </div>
    <div class="kol-split-legend">
      <span><span class="kol-split-dot" style="background:#003A8F"></span>ISP — ${ispKols.length} KOLs (${ispPct}%)</span>
      <span><span class="kol-split-dot" style="background:#78BE20"></span>NSP — ${nspKols.length} KOLs (${nspPct}%)</span>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:10px">Session Appearances</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="kol-stat-card" style="padding:12px">
          <div class="kol-stat-label">One-Time</div>
          <div class="kol-stat-val" style="font-size:24px">${totalUnique - repeatKols.length}</div>
          <div class="kol-stat-sub">spoke once</div>
        </div>
        <div class="kol-stat-card" style="padding:12px">
          <div class="kol-stat-label">Repeat</div>
          <div class="kol-stat-val purple" style="font-size:24px">${repeatKols.length}</div>
          <div class="kol-stat-sub">2+ sessions</div>
        </div>
      </div>
    </div>`;

  // ── THERAPY MIX ──
  const maxT = Math.max(oncoKols.length, opthKols.length, 1);
  document.getElementById('kolTherapyMix').innerHTML = [
    { label:'Oncology', count: oncoKols.length, color: COLORS.onco },
    { label:'Ophthalmology', count: opthKols.length, color: COLORS.opthal },
  ].map(t => `
    <div class="kol-therapy-row">
      <div class="kol-therapy-label">${t.label}</div>
      <div class="kol-therapy-bar-wrap">
        <div class="kol-therapy-bar" style="width:${Math.round(t.count/maxT*100)}%;background:${t.color}"></div>
      </div>
      <div class="kol-therapy-count">${t.count}</div>
    </div>`).join('')
  + `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Cross-therapy KOLs</div>
      <div style="font-size:24px;font-weight:700;color:#7C3AED">${allKols.filter(k => k.therapies.size > 1).length}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">speakers across both therapy areas</div>
    </div>`;

  // ── TOP SPEAKERS LIST ──
  const sorted = [...allKols].sort((a,b) => b.sessions.length - a.sessions.length);
  const top10 = sorted.slice(0, 10);
  document.getElementById('kolTopList').innerHTML = top10.length
    ? top10.map((k) => {
        const col = kolAvatarColor(k.name);
        const therapyLabel = [...k.therapies].join(' · ');
        const typeLabel = [...k.types].join(' · ');
        return `<div class="kol-row">
          <div class="kol-avatar" style="background:${col}">${initials(k.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="kol-name">${k.name}</div>
            <div class="kol-meta">${therapyLabel} · ${typeLabel}</div>
          </div>
          <div class="kol-badge-count${k.sessions.length > 1 ? ' green' : ''}">${k.sessions.length} session${k.sessions.length>1?'s':''}</div>
        </div>`;
      }).join('')
    : '<div class="kol-empty">No KOL data available.</div>';

  // ── ISP SPOTLIGHT ──
  const ispSorted = [...ispKols].sort((a,b) => b.sessions.length - a.sessions.length);
  document.getElementById('kolIspList').innerHTML = ispSorted.length
    ? ispSorted.slice(0, 10).map(k => {
        const therapyLabel = [...k.therapies].join(' · ');
        return `<div class="kol-isp-row">
          <div class="kol-isp-avatar">${initials(k.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="kol-isp-name">${k.name}</div>
            <div class="kol-isp-meta">${therapyLabel}</div>
          </div>
          <div class="kol-isp-pill">${k.sessions.length}×</div>
        </div>`;
      }).join('')
    : '<div style="color:rgba(255,255,255,.35);font-size:12px;padding:12px 0">No ISP KOL data yet.</div>';

  // ── NSP LIST ──
  const nspSorted = [...nspKols].sort((a,b) => b.sessions.length - a.sessions.length);
  document.getElementById('kolNspList').innerHTML = nspSorted.length
    ? nspSorted.slice(0, 10).map((k) => {
        const col = kolAvatarColor(k.name);
        const therapyLabel = [...k.therapies].join(' · ');
        return `<div class="kol-row">
          <div class="kol-avatar" style="background:${col}">${initials(k.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="kol-name">${k.name}</div>
            <div class="kol-meta">${therapyLabel}</div>
          </div>
          <div class="kol-badge-count">${k.sessions.length} session${k.sessions.length>1?'s':''}</div>
        </div>`;
      }).join('')
    : '<div class="kol-empty">No NSP KOL data available.</div>';

  // ── MONTHLY TREND CHART ──
  const MONTH_ORDER_LOCAL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabels = MONTH_ORDER_LOCAL.map(m => m.slice(0,3));
  const kolByMonth = MONTH_ORDER_LOCAL.map(m => {
    const rows = RAW_DATA.filter(r => r.month === m);
    const keys = new Set();
    rows.forEach(r => (r.kols||[]).forEach(n => keys.add(kolKey(n))));
    return keys.size;
  });
  const ispByMonth = MONTH_ORDER_LOCAL.map(m => {
    const rows = RAW_DATA.filter(r => r.month === m && r.type === 'ISP');
    const keys = new Set();
    rows.forEach(r => (r.kols||[]).forEach(n => keys.add(kolKey(n))));
    return keys.size;
  });
  const nspByMonth = MONTH_ORDER_LOCAL.map(m => {
    const rows = RAW_DATA.filter(r => r.month === m && r.type === 'NSP');
    const keys = new Set();
    rows.forEach(r => (r.kols||[]).forEach(n => keys.add(kolKey(n))));
    return keys.size;
  });

  destroyChart('chartKolMonthly');
  charts.chartKolMonthly = new Chart(document.getElementById('chartKolMonthly'), {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'ISP KOLs', data: ispByMonth, backgroundColor: 'rgba(0,58,143,0.85)', borderRadius: 3, stack: 'kol' },
        { label: 'NSP KOLs', data: nspByMonth, backgroundColor: 'rgba(120,190,32,0.75)', borderRadius: 3, stack: 'kol' },
      ]
    },
    options: {
      responsive: true, animation: { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 }, padding: 16 } },
        tooltip: { ...ttStyle() }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { stacked: true, beginAtZero: true, grid: { color: gridC() }, ticks: { stepSize: 1, font: { size: 11 } } }
      }
    }
  });
}
