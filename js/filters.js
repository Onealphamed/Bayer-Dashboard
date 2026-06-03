// FILTERS MODULE

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let activeMonths    = new Set();
let activeYears     = new Set();
let activeTherapies = new Set(['Onco','Opthal']);

function getYear(d) {
  if (!d.date) return null;
  const m = d.date.match(/\b(202\d)\b/);
  return m ? parseInt(m[1]) : null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const filt = data => data.filter(d =>
  (activeMonths.size === 0 || activeMonths.has(normalizeMonth(d.month))) &&
  (activeYears.size  === 0 || activeYears.has(getYear(d))) &&
  (activeTherapies.size === 0 || activeTherapies.has(d.therapy))
);
const groupBy = (arr,key) => arr.reduce((a,d)=>{ (a[d[key]]=a[d[key]]||[]).push(d); return a; },{});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CROSS-FILTER: CLICK A MONTH ON A CHART
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function onChartClick(evt, elements, chart, monthLabels) {
  if (!elements.length) return;
  const idx    = elements[0].index;
  const month  = MONTH_ORDER.find(m => m.slice(0,3) === monthLabels[idx]) || monthLabels[idx];
  const btn    = document.querySelector(`[data-month="${month}"]`);
  if (!btn) return;
  if (activeMonths.has(month)) activeMonths.delete(month);
  else activeMonths.add(month);
  syncMonthUI();
  showToast(`Filter: ${month}`);
  refresh();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOAST HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILTERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function syncMonthUI() {
  const allBtn = document.querySelector('.all-chip');
  const clearBtn = document.getElementById('monthClear');
  const isAll = activeMonths.size === 0;
  if (allBtn) allBtn.classList.toggle('active', isAll);
  if (clearBtn) clearBtn.classList.toggle('show', !isAll);
  document.querySelectorAll('[data-month]').forEach(b => {
    b.classList.toggle('active', activeMonths.has(b.dataset.month));
  });
}

function syncYearUI() {
  document.querySelectorAll('[data-year]').forEach(b => {
    const yr = parseInt(b.dataset.year);
    b.classList.toggle('active', activeYears.size === 0
      ? b.dataset.year === 'all'
      : activeYears.has(yr));
  });
  // Rebuild month chips sorted correctly for the selected year(s)
  const relevantData = activeYears.size === 0 ? RAW_DATA
    : RAW_DATA.filter(d => activeYears.has(getYear(d)));
  const months = getSortedMonths(relevantData);
  const mDiv = document.getElementById('monthFilters');
  mDiv.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-chip all-chip' + (activeMonths.size === 0 ? ' active' : '');
  allBtn.textContent = 'All'; allBtn.onclick = () => clearMonths();
  mDiv.appendChild(allBtn);
  months.forEach(m => {
    const b = document.createElement('button');
    b.className = 'filter-chip' + (activeMonths.has(m) ? ' active' : '');
    b.textContent = m.slice(0,3); b.title = m; b.dataset.month = m;
    b.onclick = () => toggleMonth(m);
    mDiv.appendChild(b);
  });
}

function initFilters() {
  // Year chips
  const years = [...new Set(RAW_DATA.map(getYear).filter(Boolean))].sort();
  const yDiv = document.getElementById('yearFilters');
  yDiv.innerHTML = '';
  const allYrBtn = document.createElement('button');
  allYrBtn.className = 'filter-chip all-chip active';
  allYrBtn.textContent = 'All'; allYrBtn.dataset.year = 'all';
  allYrBtn.onclick = () => { activeYears.clear(); activeMonths.clear(); syncYearUI(); syncMonthUI(); refresh(); };
  yDiv.appendChild(allYrBtn);
  years.forEach(yr => {
    const b = document.createElement('button');
    b.className = 'filter-chip'; b.textContent = yr; b.dataset.year = yr;
    b.onclick = () => toggleYear(yr);
    yDiv.appendChild(b);
  });

  syncYearUI();

  const tDiv = document.getElementById('therapyFilters');
  tDiv.innerHTML = '';
  [['Onco','Oncology','onco'],['Opthal','Ophthal','opthal']].forEach(([val,label,cls]) => {
    const b = document.createElement('button');
    b.className = `filter-chip ${cls} active`; b.textContent = label;
    b.onclick = () => toggleTherapy(val,b); b.dataset.therapy = val;
    tDiv.appendChild(b);
  });
}

function toggleYear(yr) {
  activeMonths.clear();
  if (activeYears.has(yr)) { activeYears.delete(yr); }
  else { activeYears.clear(); activeYears.add(yr); }
  syncYearUI(); syncMonthUI(); refresh();
}

function toggleMonth(m) {
  if(activeMonths.has(m)) activeMonths.delete(m);
  else activeMonths.add(m);
  syncMonthUI();
  refresh();
}

function clearMonths() {
  activeMonths.clear();
  syncMonthUI();
  refresh();
}
function toggleTherapy(t,btn) {
  if(activeTherapies.has(t)){
    if(activeTherapies.size===1) return;
    activeTherapies.delete(t);btn.classList.remove('active');
  } else{activeTherapies.add(t);btn.classList.add('active');}
  refresh();
}
