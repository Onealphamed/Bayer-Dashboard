// TAB1 DASHBOARD MODULE

let tableSortCol    = 'date';
let tableSortDir    = 1;
let charts          = {};
let currentData     = [...RAW_DATA];
let sparkCharts     = {};

const destroyChart = id => { if(charts[id]){charts[id].destroy();delete charts[id];} };
const destroySpark = id => { if(sparkCharts[id]){sparkCharts[id].destroy();delete sparkCharts[id];} };

Chart.defaults.font.family = 'Inter';
Chart.defaults.color = document.documentElement.classList.contains('dark') ? '#8899B0' : '#64748B';

const gridC = () => document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

function ttStyle(extras={}) {
  return {
    backgroundColor:'#1A2B4A', titleColor:'#fff',
    bodyColor:'rgba(255,255,255,.82)', borderColor:'rgba(255,255,255,.08)',
    borderWidth:1, padding:12, cornerRadius:10,
    titleFont:{weight:'600',size:12}, bodyFont:{size:11},
    ...extras
  };
}

// Bucketed by month AND year, so July 2025 and July 2026 are separate points.
function inBucket(x, b) {
  return normalizeMonth(x.month) === b.month && getYear(x) === b.year;
}

function getMonthlyData() {
  const d = currentData;
  const buckets   = getMonthYearBuckets(d);
  const multiYear = new Set(buckets.map(b => b.year)).size > 1;
  return buckets.map((b,i,arr) => {
    const onco      = d.filter(x=>inBucket(x,b) && x.therapy==='Onco');
    const opthal    = d.filter(x=>inBucket(x,b) && x.therapy==='Opthal');
    const oncoAtt   = onco.filter(x=>x.attendees);
    const opthalAtt = opthal.filter(x=>x.attendees);
    // Previous bucket (chronological) for % change
    const prevB     = arr[i-1];
    const prevOnco  = prevB ? d.filter(x=>inBucket(x,prevB) && x.therapy==='Onco') : [];
    const prevOpth  = prevB ? d.filter(x=>inBucket(x,prevB) && x.therapy==='Opthal') : [];
    const oncoChg   = prevOnco.length ? pct(onco.length, prevOnco.length) : null;
    const opthalChg = prevOpth.length ? pct(opthal.length, prevOpth.length) : null;
    return {
      month: bucketLabel(b, multiYear), fullMonth: b.month, year: b.year, key: b.key,
      oncoCount:onco.length, opthalCount:opthal.length,
      oncoAtt:sum(oncoAtt.map(x=>x.attendees)),
      opthalAtt:sum(opthalAtt.map(x=>x.attendees)),
      oncoAvg:oncoAtt.length ? avg(oncoAtt.map(x=>x.attendees)) : null,
      opthalAvg:opthalAtt.length ? avg(opthalAtt.map(x=>x.attendees)) : null,
      oncoChg, opthalChg
    };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TARGET TRACKER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function targetCardHTML(label, icon, accentColor, count, monthsElapsed, monthsRemaining) {
  const TARGET   = 200;
  const pct      = Math.min(Math.round(count / TARGET * 100), 100);
  const needed   = Math.max(TARGET - count, 0);
  const currAvg  = (count / monthsElapsed).toFixed(1);
  const reqAvg   = monthsRemaining > 0 ? (needed / monthsRemaining).toFixed(1) : (count >= TARGET ? '✓' : 'N/A');
  const achieved = count >= TARGET;
  const onTrack  = !achieved && parseFloat(currAvg) >= parseFloat(reqAvg);
  const badgeCls = achieved ? 'target-badge-achieved' : onTrack ? 'target-badge-track' : 'target-badge-behind';
  const badgeTxt = achieved ? '✓ Achieved' : onTrack ? '↑ On Track' : '↓ Behind';
  const statusColor = achieved ? '#16A34A' : onTrack ? '#D97706' : '#DC2626';

  // SVG ring — r=54, circumference=339.3
  const R = 54, C = 2 * Math.PI * R;
  const trackDash  = C;
  const fillDash   = (pct / 100) * C;
  const fillOffset = C - fillDash;
  const ring = '<svg width="130" height="130" viewBox="0 0 130 130">'
    + '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="var(--border)" stroke-width="10"/>'
    + '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="' + accentColor + '" stroke-width="10"'
    + ' stroke-linecap="round"'
    + ' stroke-dasharray="' + C.toFixed(1) + '"'
    + ' stroke-dashoffset="' + fillOffset.toFixed(1) + '"'
    + ' style="transition:stroke-dashoffset .8s ease"/>'
    + '</svg>';

  return '<div class="target-card">'
    // header
    + '<div class="target-top"><div>'
    + '<div class="target-title">' + icon + ' ' + label + '</div>'
    + '<div class="target-subtitle">2026 Annual Target &middot; ' + TARGET + ' webinars</div>'
    + '</div><span class="' + badgeCls + '">' + badgeTxt + '</span></div>'
    // body: ring + stats
    + '<div class="target-body">'
    // ring
    + '<div class="target-ring-wrap">'
    + ring
    + '<div class="target-ring-center">'
    + '<div class="target-ring-count" style="color:' + accentColor + '">' + count + '</div>'
    + '<div class="target-ring-pct">' + pct + '%</div>'
    + '<div class="target-ring-label">of ' + TARGET + '</div>'
    + '</div></div>'
    // stats
    + '<div class="target-stats">'
    + '<div class="target-stat-row">'
    + '<div class="target-stat"><div class="target-stat-val" style="color:' + accentColor + '">' + currAvg + '</div>'
    + '<div class="target-stat-lbl">Current Avg<br/>/ month</div></div>'
    + '<div class="target-stat"><div class="target-stat-val" style="color:' + statusColor + '">' + reqAvg + '</div>'
    + '<div class="target-stat-lbl">Required Avg<br/>/ month</div></div>'
    + '</div>'
    + '<div class="target-divider"></div>'
    + '<div class="target-months">'
    + '<span>Completed: <strong>' + count + '</strong></span>'
    + '<span>Remaining: <strong>' + needed + '</strong></span>'
    + '</div>'
    + '<div class="target-months">'
    + '<span>Months elapsed: <strong>' + monthsElapsed + '</strong></span>'
    + '<span>Months left: <strong>' + monthsRemaining + '</strong></span>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function renderTargets() {
  const now             = new Date();
  const monthsElapsed   = [...new Set(RAW_DATA.filter(x => getYear(x) === 2026).map(x => x.month))].length || 1;
  const monthsRemaining = Math.max(11 - now.getMonth(), 0);
  const oncoCount       = RAW_DATA.filter(x => getYear(x) === 2026 && x.therapy === 'Onco').length;
  const ophthCount      = RAW_DATA.filter(x => getYear(x) === 2026 && x.therapy === 'Opthal').length;
  const el              = document.getElementById('targetGrid');
  if (!el) return;

  // Current month name (e.g. "May")
  const curMonthName = now.toLocaleString('en-US', { month: 'long' });

  // May 2025 count — match month name case-insensitively
  const may2025 = RAW_DATA.filter(x =>
    getYear(x) === 2025 &&
    (x.month || '').toLowerCase() === curMonthName.toLowerCase()
  ).length;

  // Current month 2026 count
  const curMonth2026 = RAW_DATA.filter(x =>
    getYear(x) === 2026 &&
    (x.month || '').toLowerCase() === curMonthName.toLowerCase()
  ).length;

  // Expected for current month = remaining target ÷ remaining months (both therapies combined)
  const totalRemaining  = Math.max((200 - oncoCount) + (200 - ophthCount), 0);
  const expectedPerMonth = monthsRemaining > 0
    ? Math.ceil(totalRemaining / monthsRemaining)
    : '—';

  const monthMiniCard = `
  <div class="target-month-block">
    <div class="target-month-title">📅 ${curMonthName} Snapshot</div>
    <div class="target-month-stats">
      <div class="target-month-stat">
        <div class="target-month-val">${may2025}</div>
        <div class="target-month-lbl">${curMonthName} 2025<br/><span>Last Year</span></div>
      </div>
      <div class="target-month-divider"></div>
      <div class="target-month-stat">
        <div class="target-month-val" style="color:var(--blue)">${curMonth2026}</div>
        <div class="target-month-lbl">${curMonthName} 2026<br/><span>This Month</span></div>
      </div>
      <div class="target-month-divider"></div>
      <div class="target-month-stat">
        <div class="target-month-val" style="color:var(--green)">${expectedPerMonth}</div>
        <div class="target-month-lbl">Expected<br/><span>Monthly Needed</span></div>
      </div>
    </div>
  </div>`;

  el.innerHTML = targetCardHTML('Oncology', '🔬', COLORS.onco, oncoCount, monthsElapsed, monthsRemaining)
               + targetCardHTML('Ophthalmology', '👁', COLORS.opthal, ophthCount, monthsElapsed, monthsRemaining)
               + monthMiniCard;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KPI CARDS WITH SPARKLINES + TREND INDICATORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function trendBadge() { return ''; }

function renderKPIs() {
  const d        = currentData;
  const all      = RAW_DATA; // for sparkline trend across all months
  const onco     = d.filter(x=>x.therapy==='Onco');
  const opthal   = d.filter(x=>x.therapy==='Opthal');
  const withAtt  = d.filter(x=>x.attendees);
  const oncoAtt  = onco.filter(x=>x.attendees);
  const opthalAtt= opthal.filter(x=>x.attendees);
  // Distinct month+year periods in the filtered data (not just month names)
  const monthCount = getMonthYearBuckets(d).length;

  // Build monthly trend arrays for sparklines (all data, not filtered).
  // Bucketed by month+year so the same month across years isn't merged.
  const mBuckets  = getMonthYearBuckets(all);
  const sparkMulti = new Set(mBuckets.map(b=>b.year)).size > 1;
  const spark = {
    oncoVol:    mBuckets.map(b=>all.filter(x=>inBucket(x,b)&&x.therapy==='Onco').length),
    opthalVol:  mBuckets.map(b=>all.filter(x=>inBucket(x,b)&&x.therapy==='Opthal').length),
    totalAtt:   mBuckets.map(b=>sum(all.filter(x=>inBucket(x,b)&&x.attendees).map(x=>x.attendees))),
    totalVol:   mBuckets.map(b=>all.filter(x=>inBucket(x,b)).length),
  };

  // Previous period comparison (last month+year vs the one before it)
  const prevB     = mBuckets[mBuckets.length-2];
  const lastB     = mBuckets[mBuckets.length-1];
  const prevAll   = prevB ? all.filter(x=>inBucket(x,prevB)) : [];
  const lastAll   = lastB ? all.filter(x=>inBucket(x,lastB)) : [];
  const prevOnco  = prevAll.filter(x=>x.therapy==='Onco').length;
  const prevOpthal= prevAll.filter(x=>x.therapy==='Opthal').length;
  const prevAtt   = sum(prevAll.filter(x=>x.attendees).map(x=>x.attendees));
  const currOnco  = onco.length;
  const currOpthal= opthal.length;
  const currAtt   = sum(withAtt.map(x=>x.attendees));

  const actKPIs = [
    { id:'spark-ov', label:'Oncology Webinars', value:fmt(currOnco), trend:trendBadge(currOnco,prevOnco), sub:'Total sessions', icon:'🔬', sparkData:spark.oncoVol, sparkColor:COLORS.onco },
    { id:'spark-pv', label:'Ophthal Webinars',  value:fmt(currOpthal), trend:trendBadge(currOpthal,prevOpthal), sub:'Total sessions', icon:'👁️', sparkData:spark.opthalVol, sparkColor:COLORS.opthal },
    { id:'spark-av', label:'Avg / Month',        value:monthCount?fmt(d.length/monthCount,1):'—', trend:'', sub:'Overall cadence', icon:'📈', sparkData:spark.totalVol, sparkColor:'#F59E0B' },
  ];
  const impKPIs = [
    { id:'spark-ta', label:'Total Attendees',        value:fmt(currAtt), trend:trendBadge(currAtt,prevAtt), sub:`Across ${withAtt.length} webinars`, icon:'👥', sparkData:spark.totalAtt, sparkColor:COLORS.opthal, green:true },
    { id:'spark-aa', label:'Avg Attendees',           value:fmt(avg(withAtt.map(x=>x.attendees)),1), trend:'', sub:'Per webinar overall', icon:'🎯', sparkData:spark.totalAtt, sparkColor:COLORS.opthal, green:true },
    { id:'spark-oa', label:'Onco Avg Attendance',    value:fmt(avg(oncoAtt.map(x=>x.attendees)),1), trend:'', sub:'Per Onco session', icon:'🔬', sparkData:mBuckets.map(b=>{const r=all.filter(x=>inBucket(x,b)&&x.therapy==='Onco'&&x.attendees);return r.length?avg(r.map(x=>x.attendees)):null;}), sparkColor:COLORS.onco },
    { id:'spark-pa', label:'Ophthal Avg Attendance', value:fmt(avg(opthalAtt.map(x=>x.attendees)),1), trend:'', sub:'Per Ophthal session', icon:'👁️', sparkData:mBuckets.map(b=>{const r=all.filter(x=>inBucket(x,b)&&x.therapy==='Opthal'&&x.attendees);return r.length?avg(r.map(x=>x.attendees)):null;}), sparkColor:COLORS.opthal },
  ];

  function renderGrid(elId, kpis) {
    const el = document.getElementById(elId);
    el.innerHTML = kpis.map(k=>`
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-label">${k.label}</div>
          <span class="kpi-icon">${k.icon}</span>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-value${k.green?' green':''}">${k.value}</div>
          ${k.trend}
        </div>
        <div class="kpi-sub">${k.sub}</div>
        <div class="kpi-sparkline"><canvas id="${k.id}"></canvas></div>
      </div>`).join('');

    // Draw sparklines after DOM is ready
    kpis.forEach(k=>{
      destroySpark(k.id);
      const canvas = document.getElementById(k.id);
      if(!canvas) return;
      const cleanData = k.sparkData.map(v=>v!=null?+v.toFixed(1):null);
      sparkCharts[k.id] = new Chart(canvas,{
        type:'line',
        data:{
          labels: mBuckets.map(b=>bucketLabel(b, sparkMulti)),
          datasets:[{data:cleanData, borderColor:k.sparkColor, backgroundColor:k.sparkColor+'22',
            borderWidth:1.5, pointRadius:0, tension:.4, fill:true, spanGaps:true}]
        },
        options:{
          responsive:true, animation:{duration:600},
          plugins:{legend:{display:false},tooltip:{enabled:false}},
          scales:{x:{display:false},y:{display:false,beginAtZero:true}}
        }
      });
    });
  }
  renderGrid('kpi-activity', actKPIs);
  renderGrid('kpi-impact',   impKPIs);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHARTS  (bar → area/line, with cross-filter click)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderCharts() {
  const md     = getMonthlyData();
  const labels = md.map(x=>x.month);
  const tt     = ttStyle();

  // % change tooltip callback
  const pctCallback = (ctx, key1, key2) => {
    const i = ctx.dataIndex;
    const change = key2 === 'oncoChg' ? md[i].oncoChg : md[i].opthalChg;
    if(change===null||change===undefined) return '';
    const sign = change>=0?'▲':'▼';
    return `  ${sign} ${Math.abs(change).toFixed(1)}% vs prev month`;
  };

  const areaDataset = (label, data, color, alpha) => ({
    label, data, borderColor:color,
    backgroundColor: alpha,
    borderWidth:2.5, pointRadius:3, pointHoverRadius:6,
    pointBackgroundColor:color, tension:.42, fill:true, spanGaps:true
  });

  // ── 1. Webinar Volume Trend (area)
  destroyChart('chartWebTrend');
  charts.chartWebTrend = new Chart(document.getElementById('chartWebTrend'),{
    type:'line',
    data:{ labels, datasets:[
      areaDataset('Oncology', md.map(x=>x.oncoCount),  COLORS.onco,   COLORS.oncoAlpha),
      areaDataset('Ophthal',  md.map(x=>x.opthalCount), COLORS.opthal, COLORS.opthalAlpha),
      {
        label:'Total',
        data: md.map(x=>x.oncoCount + x.opthalCount),
        borderColor:'#F59E0B',
        backgroundColor:'rgba(245,158,11,0.06)',
        borderWidth:2, borderDash:[5,3],
        pointRadius:3, pointHoverRadius:6,
        pointBackgroundColor:'#F59E0B',
        tension:.42, fill:false
      }
    ]},
    options:{
      responsive:true, animation:{duration:500},
      interaction:{mode:'index',intersect:false},
      onClick:(e,els)=>onChartClick(e,els,charts.chartWebTrend,md),
      plugins:{
        legend:{labels:{boxWidth:10,usePointStyle:true,font:{size:11},padding:16}},
        tooltip:{...tt, callbacks:{
          afterBody: ctx=>{
            const i = ctx[0]?.dataIndex;
            if(i==null) return [];
            return [
              md[i].oncoChg!=null ? `Onco vs prev: ${md[i].oncoChg>=0?'▲':'▼'}${Math.abs(md[i].oncoChg).toFixed(1)}%`:'',
              md[i].opthalChg!=null ? `Ophthal vs prev: ${md[i].opthalChg>=0?'▲':'▼'}${Math.abs(md[i].opthalChg).toFixed(1)}%`:''
            ].filter(Boolean);
          }
        }}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{beginAtZero:true, grid:{color:gridC()}, ticks:{stepSize:1,font:{size:11}}}
      }
    }
  });

  // ── 2. Attendee Volume Trend (area)
  destroyChart('chartAttTrend');
  charts.chartAttTrend = new Chart(document.getElementById('chartAttTrend'),{
    type:'line',
    data:{ labels, datasets:[
      areaDataset('Oncology', md.map(x=>x.oncoAtt||null),  COLORS.onco,   COLORS.oncoAlpha),
      areaDataset('Ophthal',  md.map(x=>x.opthalAtt||null), COLORS.opthal, COLORS.opthalAlpha),
      {
        label:'Total',
        data: md.map(x=>(x.oncoAtt||0)+(x.opthalAtt||0)||null),
        borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.06)',
        borderWidth:2, borderDash:[5,3],
        pointRadius:3, pointHoverRadius:6, pointBackgroundColor:'#F59E0B',
        tension:.42, fill:false
      }
    ]},
    options:{
      responsive:true, animation:{duration:500},
      interaction:{mode:'index',intersect:false},
      onClick:(e,els)=>onChartClick(e,els,charts.chartAttTrend,md),
      plugins:{
        legend:{labels:{boxWidth:10,usePointStyle:true,font:{size:11},padding:16}},
        tooltip:{...tt}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{beginAtZero:true, grid:{color:gridC()}, ticks:{font:{size:11}}}
      }
    }
  });

  // ── 3. Monthly Comparison — LINE (was bar)
  destroyChart('chartMonthComp');
  charts.chartMonthComp = new Chart(document.getElementById('chartMonthComp'),{
    type:'line',
    data:{ labels, datasets:[
      areaDataset('Oncology', md.map(x=>x.oncoCount),  COLORS.onco,   COLORS.oncoAlpha),
      areaDataset('Ophthal',  md.map(x=>x.opthalCount), COLORS.opthal, COLORS.opthalAlpha),
      {
        label:'Total',
        data: md.map(x=>x.oncoCount + x.opthalCount),
        borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.06)',
        borderWidth:2, borderDash:[5,3],
        pointRadius:3, pointHoverRadius:6, pointBackgroundColor:'#F59E0B',
        tension:.42, fill:false
      }
    ]},
    options:{
      responsive:true, animation:{duration:500},
      interaction:{mode:'index',intersect:false},
      onClick:(e,els)=>onChartClick(e,els,charts.chartMonthComp,md),
      plugins:{
        legend:{labels:{boxWidth:10,usePointStyle:true,font:{size:11},padding:14}},
        tooltip:{...tt}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:10}}},
        y:{beginAtZero:true, grid:{color:gridC()}, ticks:{stepSize:1,font:{size:10}}}
      }
    }
  });

  // ── 4. Efficiency Trend — SMOOTH LINE (was bar)
  destroyChart('chartEfficiency');
  charts.chartEfficiency = new Chart(document.getElementById('chartEfficiency'),{
    type:'line',
    data:{ labels, datasets:[
      areaDataset('Onco Avg',   md.map(x=>x.oncoAvg  ?+x.oncoAvg.toFixed(1):null),   COLORS.onco,   COLORS.oncoAlpha),
      areaDataset('Ophthal Avg',md.map(x=>x.opthalAvg?+x.opthalAvg.toFixed(1):null), COLORS.opthal, COLORS.opthalAlpha),
      {
        label:'Overall Avg',
        data: md.map(x=>{
          const att=[...Array(x.oncoCount).fill(x.oncoAvg||0),...Array(x.opthalCount).fill(x.opthalAvg||0)];
          const total=att.filter(Boolean);
          return total.length ? +(total.reduce((a,b)=>a+b,0)/total.length).toFixed(1) : null;
        }),
        borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.06)',
        borderWidth:2, borderDash:[5,3],
        pointRadius:3, pointHoverRadius:6, pointBackgroundColor:'#F59E0B',
        tension:.42, fill:false
      }
    ]},
    options:{
      responsive:true, animation:{duration:500},
      interaction:{mode:'index',intersect:false},
      onClick:(e,els)=>onChartClick(e,els,charts.chartEfficiency,md),
      plugins:{
        legend:{labels:{boxWidth:10,usePointStyle:true,font:{size:11},padding:14}},
        tooltip:{...tt, callbacks:{label: ctx=>`  ${ctx.dataset.label}: ${ctx.raw ?? '—'} attendees`}}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:10}}},
        y:{beginAtZero:false, grid:{color:gridC()}, ticks:{font:{size:10}}}
      }
    }
  });

  // ── 5. Donut
  const oncoTotal  = currentData.filter(x=>x.therapy==='Onco').length;
  const opthalTotal= currentData.filter(x=>x.therapy==='Opthal').length;
  destroyChart('chartDonut');
  charts.chartDonut = new Chart(document.getElementById('chartDonut'),{
    type:'doughnut',
    data:{
      labels:['Oncology','Ophthal'],
      datasets:[{data:[oncoTotal,opthalTotal], backgroundColor:[COLORS.onco,COLORS.opthal], borderWidth:0, hoverOffset:8}]
    },
    options:{
      responsive:false, cutout:'70%', animation:{duration:600},
      plugins:{
        legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true,font:{size:11},padding:14}},
        tooltip:{...tt, callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw} (${(ctx.raw/(oncoTotal+opthalTotal)*100).toFixed(1)}%)`}}
      }
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// YEAR VS YEAR CHART
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderYearVsYear() {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const labels = MONTHS.map(m => m.slice(0,3));

  const r2025 = RAW_DATA.filter(d => getYear(d) === 2025);
  const r2026 = RAW_DATA.filter(d => getYear(d) === 2026);

  const onco2025  = MONTHS.map(m => r2025.filter(d => d.month === m && d.therapy === 'Onco').length);
  const opth2025  = MONTHS.map(m => r2025.filter(d => d.month === m && d.therapy === 'Opthal').length);
  const onco2026  = MONTHS.map(m => r2026.filter(d => d.month === m && d.therapy === 'Onco').length);
  const opth2026  = MONTHS.map(m => r2026.filter(d => d.month === m && d.therapy === 'Opthal').length);

  // totals for tooltip footer
  const tot2025 = MONTHS.map((_, i) => onco2025[i] + opth2025[i]);
  const tot2026 = MONTHS.map((_, i) => onco2026[i] + opth2026[i]);

  destroyChart('chartYearVsYear');
  charts.chartYearVsYear = new Chart(document.getElementById('chartYearVsYear'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Onco 2025',  data: onco2025, backgroundColor: 'rgba(0,58,143,0.85)',   borderRadius: 3, stack: '2025' },
        { label: 'Ophthal 2025', data: opth2025, backgroundColor: 'rgba(0,58,143,0.35)', borderRadius: 3, stack: '2025' },
        { label: 'Onco 2026',  data: onco2026, backgroundColor: 'rgba(120,190,32,0.85)', borderRadius: 3, stack: '2026' },
        { label: 'Ophthal 2026', data: opth2026, backgroundColor: 'rgba(120,190,32,0.38)', borderRadius: 3, stack: '2026' },
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 }, padding: 16 } },
        tooltip: { ...ttStyle(), callbacks: {
          afterBody: ctx => {
            const i = ctx[0]?.dataIndex;
            const v25 = tot2025[i], v26 = tot2026[i];
            const lines = [];
            if (v25) lines.push('  2025 Total: ' + v25);
            if (v26) lines.push('  2026 Total: ' + v26);
            if (v25 && v26) {
              const diff = v26 - v25;
              const sign = diff >= 0 ? '▲' : '▼';
              lines.push('  ' + sign + ' ' + Math.abs(diff) + ' YoY (' + (diff >= 0 ? '+' : '') + ((diff/v25)*100).toFixed(0) + '%)');
            }
            return lines;
          }
        }}
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { beginAtZero: true, stacked: true, grid: { color: gridC() }, ticks: { stepSize: 1, font: { size: 11 } } }
      }
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSIGHTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderInsights() {
  // Insights use year filter only — therapy selection does not affect them
  const d      = activeYears.size === 0 ? RAW_DATA : RAW_DATA.filter(x => activeYears.has(getYear(x)));
  const onco   = d.filter(x => x.therapy === 'Onco');
  const opthal = d.filter(x => x.therapy === 'Opthal');
  const denom  = (onco.length + opthal.length) || 1;

  // Build year+month pairs to avoid cross-year name collisions (e.g. Feb 2025 ≠ Feb 2026)
  const ymMap = {};
  d.forEach(x => {
    const yr = getYear(x);
    if (!yr || !x.month) return;
    const key = yr + '-' + x.month;
    if (!ymMap[key]) {
      ymMap[key] = { year: yr, month: x.month, date: parseDateLoose(x.date), onco: 0, opthal: 0, total: 0 };
    }
    if (x.therapy === 'Onco')        ymMap[key].onco++;
    else if (x.therapy === 'Opthal') ymMap[key].opthal++;
    ymMap[key].total++;
  });
  const ymList = Object.values(ymMap).filter(ym => ym.date).sort((a, b) => a.date - b.date);

  // Trend: compare most recent month vs the one before it
  const lastYM      = ymList[ymList.length - 1];
  const prevYM      = ymList[ymList.length - 2];
  const oncoTrend   = (lastYM && prevYM) ? lastYM.onco   - prevYM.onco   : 0;
  const opthalTrend = (lastYM && prevYM) ? lastYM.opthal - prevYM.opthal : 0;
  const trendDir    = n => n > 0 ? '↑ growing' : n < 0 ? '↓ declining' : '→ flat';

  // Peak year-month by total webinars
  const peakYM    = ymList.reduce((best, ym) => ym.total > (best ? best.total : 0) ? ym : best, null);
  const peakLabel = peakYM ? peakYM.month + ' ' + peakYM.year : '—';
  const peakCount = peakYM ? peakYM.total : 0;

  // Cadence: use per-therapy active month counts as denominator
  const activeMonths       = ymList.length || 1;
  const oncoActiveMonths   = ymList.filter(ym => ym.onco   > 0).length || 1;
  const opthalActiveMonths = ymList.filter(ym => ym.opthal > 0).length || 1;

  const insights = [
    {
      tag: onco.length >= opthal.length ? {cls:'positive',txt:'Onco Leads'} : {cls:'neutral',txt:'Ophthal Leads'},
      title:'📊 Volume Split',
      text:`Oncology: <strong>${onco.length}</strong> webinars (${Math.round(onco.length/denom*100)}%) · Ophthal: <strong>${opthal.length}</strong> webinars (${Math.round(opthal.length/denom*100)}%). ${onco.length >= opthal.length ? 'Oncology leads overall volume.' : 'Ophthal leads overall volume.'}`
    },
    {
      tag: {cls:'neutral', txt:'Trend'},
      title:'📅 Recent Trend',
      text:`Latest month (${lastYM ? lastYM.month + ' ' + lastYM.year : '—'}): Oncology <strong>${trendDir(oncoTrend)}</strong>, Ophthal <strong>${trendDir(opthalTrend)}</strong> vs prior month. Peak: <strong>${peakLabel}</strong> with <strong>${peakCount}</strong> webinars.`
    },
    {
      tag: {cls:'positive', txt:'Cadence'},
      title:'📆 Monthly Cadence',
      text:`<strong>${activeMonths}</strong> active months. Overall avg <strong>${(d.length / activeMonths).toFixed(1)}</strong>/month — Onco <strong>${(onco.length / oncoActiveMonths).toFixed(1)}</strong>/month (${oncoActiveMonths} months), Ophthal <strong>${(opthal.length / opthalActiveMonths).toFixed(1)}</strong>/month (${opthalActiveMonths} months).`
    }
  ];

  document.getElementById('insightsGrid').innerHTML = insights.map(i=>`
    <div class="insight-card">
      <span class="insight-tag ${i.tag.cls}">${i.tag.txt}</span>
      <div class="insight-title">${i.title}</div>
      <div class="insight-text">${i.text}</div>
    </div>`).join('');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TABLE (preserved + minor polish)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let tableData = [];
function renderTable() { tableData=[...currentData]; filterTable(); }
function filterTable() {
  const q=(document.getElementById('tableSearch').value||'').toLowerCase();
  let rows=tableData.filter(d=>
    !q||d.event.toLowerCase().includes(q)||d.therapy.toLowerCase().includes(q)||
    (d.type||'').toLowerCase().includes(q)||(d.month||'').toLowerCase().includes(q)
  );
  rows.sort((a,b)=>{
    let va=a[tableSortCol],vb=b[tableSortCol];
    if(va==null)va='';if(vb==null)vb='';
    return typeof va==='number'?tableSortDir*(va-vb):tableSortDir*String(va).localeCompare(String(vb));
  });
  document.getElementById('tableInfo').textContent=`${rows.length} of ${tableData.length} records`;
  document.getElementById('tableBody').innerHTML=rows.map(d=>`
    <tr>
      <td style="color:var(--muted);font-size:11px">${d.id}</td>
      <td><span class="badge ${d.therapy==='Onco'?'badge-onco':'badge-opthal'}">${d.therapy==='Onco'?'Onco':'Opthal'}</span></td>
      <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.event}">${d.event}</td>
      <td style="white-space:nowrap;color:var(--muted);font-size:12px">${d.date}</td>
      <td style="color:var(--muted)">${d.month||'—'}</td>
      <td><span class="badge badge-${(d.type||'nsp').toLowerCase()}">${d.type||'NSP'}</span></td>
      <td style="font-weight:600;text-align:right">${d.attendees!=null?d.attendees.toLocaleString():'<span style="color:var(--muted)">—</span>'}</td>
      <td><span class="badge ${d.reported?'badge-yes':'badge-no'}">${d.reported?'Yes':'No'}</span></td>
    </tr>`).join('');
}
function sortTable(col){
  tableSortCol===col?tableSortDir*=-1:(tableSortCol=col,tableSortDir=1); filterTable();
}
