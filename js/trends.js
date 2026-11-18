// REQUEST TRENDS MODULE
// Day-wise invitation-request trends (each webinar = one request, by Date of
// event), compared month-on-month like a cricket "run rate": cumulative worm,
// week-on-week bars, and day-on-day line. Independent of the global filters —
// it has its own two-month pickers and an All/Onco/Opthal toggle.

let trendMonthA   = null;   // 'yyyy-MM'
let trendMonthB   = null;   // 'yyyy-MM'
let trendTherapy  = 'all';  // 'all' | 'Onco' | 'Opthal'
let trendUserPicked = false; // once the user chooses, stop auto-tracking latest

function trendDate(raw) {
  if (!raw) return null;
  return parseDateLoose(raw.toString().trim().replace(/sept/ig, 'Sep'));
}
function monthKey(dt)   { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
function monthLabel(key){ const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }); }
function daysInMonth(key){ const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); }

// Rows (respecting the therapy toggle) as {dt, key}
function trendRows() {
  return (typeof RAW_DATA !== 'undefined' ? RAW_DATA : [])
    .filter(d => trendTherapy === 'all' || d.therapy === trendTherapy)
    .map(d => ({ dt: trendDate(d.date) }))
    .filter(r => r.dt);
}
function availableTrendMonths() {
  const s = new Set(trendRows().map(r => monthKey(r.dt)));
  return [...s].sort();               // ascending yyyy-MM
}
// Per-day counts for a month, 1-indexed (index 0 unused)
function dailyCounts(key) {
  const arr = new Array(daysInMonth(key) + 1).fill(0);
  trendRows().forEach(r => { if (monthKey(r.dt) === key) arr[r.dt.getDate()]++; });
  return arr;
}
// How far into the month to draw: today for the live month, else the full month
function activeDay(key) {
  const now = new Date();
  return key === monthKey(now) ? now.getDate() : daysInMonth(key);
}
// Weekly sums from a 0-indexed daily array (null = not yet / out of range),
// so weekly bars stay consistent with the as-of-today totals and cumulative.
function weeklyFromDaily(daily) {
  const w = [0, 0, 0, 0, 0];
  for (let i = 0; i < daily.length; i++) if (daily[i] != null) w[Math.min(4, Math.floor(i / 7))] += daily[i];
  return w;
}

function setTrendMonth(which, val) { trendUserPicked = true; if (which === 'A') trendMonthA = val; else trendMonthB = val; renderRequestTrends(); }
function setTrendTherapy(t, btn) {
  trendTherapy = t;
  const bar = document.getElementById('reqTherapy');
  if (bar) bar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // months list can change with therapy; keep selection if still valid
  renderRequestTrends();
}

function renderRequestTrends() {
  const host = document.getElementById('reqKpis');
  if (!host) return;
  const months = availableTrendMonths();
  if (!months.length) { host.innerHTML = '<div class="notes-empty">No dated requests to chart yet.</div>'; return; }

  // Until the user picks, keep A = latest month and B = the one before (so it
  // tracks newly synced months). After a pick, respect it but re-validate.
  if (!trendUserPicked) {
    trendMonthA = months[months.length - 1];
    trendMonthB = months[Math.max(0, months.length - 2)];
  } else {
    if (!months.includes(trendMonthA)) trendMonthA = months[months.length - 1];
    if (!months.includes(trendMonthB)) trendMonthB = months[Math.max(0, months.length - 2)];
  }

  // populate the two dropdowns (latest first), preserving current selection
  const opts = key => months.slice().reverse()
    .map(k => `<option value="${k}"${k === key ? ' selected' : ''}>${monthLabel(k)}</option>`).join('');
  const selA = document.getElementById('reqMonthA'), selB = document.getElementById('reqMonthB');
  if (selA) selA.innerHTML = opts(trendMonthA);
  if (selB) selB.innerHTML = opts(trendMonthB);

  const dimA = daysInMonth(trendMonthA), dimB = daysInMonth(trendMonthB), maxDim = Math.max(dimA, dimB);
  const dayA = activeDay(trendMonthA),   dayB = activeDay(trendMonthB);
  const dA = dailyCounts(trendMonthA),   dB = dailyCounts(trendMonthB);

  // daily + cumulative arrays over 1..maxDim, null beyond each month's active day
  const dailyA = [], dailyB = [], cumA = [], cumB = [];
  let sA = 0, sB = 0;
  for (let i = 1; i <= maxDim; i++) {
    if (i <= dimA && i <= dayA) { dailyA.push(dA[i]); sA += dA[i]; cumA.push(sA); } else { dailyA.push(null); cumA.push(i <= dayA ? sA : null); }
    if (i <= dimB && i <= dayB) { dailyB.push(dB[i]); sB += dB[i]; cumB.push(sB); } else { dailyB.push(null); cumB.push(i <= dayB ? sB : null); }
  }
  const totalA = sA, totalB = sB;
  const labelA = monthLabel(trendMonthA), labelB = monthLabel(trendMonthB);

  // run-rate projection for an in-progress month
  const inProgA = dayA < dimA;
  const paceA = dayA ? totalA / dayA : 0;
  const projA = inProgA ? Math.round(paceA * dimA) : totalA;
  const pct = totalB > 0 ? Math.round((totalA - totalB) / totalB * 100) : null;
  const pctTxt = pct === null ? '—' : (pct >= 0 ? '▲ ' : '▼ ') + Math.abs(pct) + '%';
  const pctCls = pct === null ? '' : (pct >= 0 ? 'up' : 'down');

  // KPI tiles
  const tile = (lbl, val, sub, cls = '') => `<div class="req-kpi"><div class="req-kpi-lbl">${lbl}</div><div class="req-kpi-val ${cls}">${val}</div><div class="req-kpi-sub">${sub}</div></div>`;
  host.innerHTML =
      tile(labelA, totalA, 'requests' + (inProgA ? ` · ${dayA}/${dimA} days` : ''))
    + tile(labelB, totalB, 'requests')
    + tile('Change', pctTxt, 'vs ' + labelB, pctCls)
    + tile('Daily pace', paceA.toFixed(1), `${labelA} · per day so far`)
    + tile(inProgA ? 'Projected' : 'Final', projA, inProgA ? 'at current run rate' : labelA + ' total');

  const sub = document.getElementById('reqCumulSub');
  if (sub) sub.textContent = inProgA
    ? `${labelA} is ${totalA >= (cumB[dayA - 1] || 0) ? 'ahead of' : 'behind'} ${labelB}'s pace at day ${dayA} (${totalA} vs ${cumB[dayA - 1] || 0})`
    : `${labelA} vs ${labelB}, full month`;

  const labels = Array.from({ length: maxDim }, (_, i) => i + 1);
  const tt = ttStyle();
  const blue = COLORS.onco, slate = '#94A3B8';

  destroyChart('chartReqCumul');
  charts.chartReqCumul = new Chart(document.getElementById('chartReqCumul'), {
    type: 'line',
    data: { labels, datasets: [
      { label: labelA, data: cumA, borderColor: blue,  backgroundColor: 'rgba(0,58,143,0.08)', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: .25, fill: true,  spanGaps: false },
      { label: labelB, data: cumB, borderColor: slate, backgroundColor: 'rgba(148,163,184,0.05)', borderWidth: 2, borderDash: [5, 4], pointRadius: 0, pointHoverRadius: 5, tension: .25, fill: false, spanGaps: false },
    ]},
    options: { responsive: true, animation: { duration: 500 }, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 }, padding: 14 } },
        tooltip: { ...tt, callbacks: { title: it => 'Day ' + it[0].label } } },
      scales: { x: { grid: { color: gridC() }, ticks: { maxTicksLimit: 16, font: { size: 10 } } },
                y: { grid: { color: gridC() }, beginAtZero: true, ticks: { precision: 0 } } } }
  });

  destroyChart('chartReqWeekly');
  charts.chartReqWeekly = new Chart(document.getElementById('chartReqWeekly'), {
    type: 'bar',
    data: { labels: ['W1', 'W2', 'W3', 'W4', 'W5'], datasets: [
      { label: labelA, data: weeklyFromDaily(dailyA), backgroundColor: blue,  borderRadius: 4 },
      { label: labelB, data: weeklyFromDaily(dailyB), backgroundColor: slate, borderRadius: 4 },
    ]},
    options: { responsive: true, animation: { duration: 500 },
      plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } }, tooltip: { ...tt } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: gridC() }, beginAtZero: true, ticks: { precision: 0 } } } }
  });

  destroyChart('chartReqDaily');
  charts.chartReqDaily = new Chart(document.getElementById('chartReqDaily'), {
    type: 'line',
    data: { labels, datasets: [
      { label: labelA, data: dailyA, borderColor: blue,  backgroundColor: 'rgba(0,58,143,0.06)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .3, fill: false, spanGaps: false },
      { label: labelB, data: dailyB, borderColor: slate, borderWidth: 1.8, borderDash: [4, 3], pointRadius: 0, pointHoverRadius: 4, tension: .3, fill: false, spanGaps: false },
    ]},
    options: { responsive: true, animation: { duration: 500 }, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } },
        tooltip: { ...tt, callbacks: { title: it => 'Day ' + it[0].label } } },
      scales: { x: { grid: { color: gridC() }, ticks: { maxTicksLimit: 16, font: { size: 10 } } },
                y: { grid: { color: gridC() }, beginAtZero: true, ticks: { precision: 0 } } } }
  });
}
