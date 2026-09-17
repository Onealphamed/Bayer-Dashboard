/* ==========================================================================
   VIEW — Client-Facing KPI Dashboard
   Form choices: "a single ratio against a limit" -> meter (one blue ramp);
   comparisons of real magnitudes -> horizontal bars with direct labels.
   No dual axes; single-series charts carry no legend (the title names them).
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  var C = UI.CHART;          /* shared validated palette slots */

  function toNum(v) {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    var m = String(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }

  /* ---------- meter widget (ratio against a limit) ------------------------ */

  function meterWidget(o) {
    var base = toNum(o.baseline), m6 = toNum(o.m6), goal = toNum(o.m12), cur = toNum(o.current);
    var lo = Math.min(base, 0);
    var span = Math.max(1, goal - lo);
    var curPct = Math.max(0, Math.min(100, ((cur - lo) / span) * 100));
    var m6Pct = Math.max(0, Math.min(100, ((m6 - lo) / span) * 100));
    var basePct = Math.max(0, Math.min(100, ((base - lo) / span) * 100));
    var onTrack = cur >= m6;
    var atGoal = cur >= goal;

    var growth = base > 0 ? Math.round(((cur - base) / base) * 100) : null;

    return '<div class="widget">' +
      '<div class="w-head"><div style="flex:1">' +
        '<div class="w-title">' + esc(o.label) + '</div>' +
        '<div class="w-sub">' + esc(o.source || '') + '</div>' +
      '</div>' +
      (atGoal
        ? '<span class="pill ok">✓ Goal met</span>'
        : (onTrack ? '<span class="pill prog">▲ On track</span>'
          : '<span class="pill warn">▼ Behind plan</span>')) +
      '</div>' +

      '<div class="w-val">' + esc(o.current || '—') + '</div>' +
      (growth !== null
        ? '<div class="w-delta ' + (growth >= 0 ? 'kpi-trend up' : 'kpi-trend down') + '">' +
          (growth >= 0 ? '▲ +' : '▼ ') + PMO.num(growth) + '% vs Month 0 baseline</div>'
        : '') +

      '<div style="margin-top:14px">' +
        '<div style="position:relative;height:10px;border-radius:5px;background:#eceef1;overflow:visible">' +
          '<i style="position:absolute;left:0;top:0;bottom:0;width:' + curPct.toFixed(1) +
            '%;background:' + C.s1 + ';border-radius:5px"></i>' +
          '<i style="position:absolute;left:' + basePct.toFixed(1) + '%;top:-3px;bottom:-3px;' +
            'width:1.5px;background:' + C.muted + '" title="Baseline"></i>' +
          '<i class="tooltip-host" data-tip="Month 6 target: ' + UI.attr(o.m6) +
            '" style="position:absolute;left:' + m6Pct.toFixed(1) + '%;top:-4px;bottom:-4px;' +
            'width:2px;background:' + C.s2 + '"></i>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:6px;' +
          'font-size:9.5px;color:var(--ink-4);font-weight:600">' +
          '<span>M0 ' + esc(o.baseline) + '</span>' +
          '<span style="color:' + C.s2 + '">M6 target ' + esc(o.m6) + '</span>' +
          '<span>M12 goal ' + esc(o.m12) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="w-foot">' +
        '<div><span class="l">Progress to goal</span><span class="v">' +
          Math.round(o.pctToGoal !== undefined ? o.pctToGoal : curPct) + '%</span></div>' +
        '<div style="text-align:right"><span class="l">Gap to M12</span><span class="v">' +
          (atGoal ? 'Achieved' : PMO.num(Math.round(goal - cur))) + '</span></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- derived headline widgets ------------------------------------ */

  function revenueWidget() {
    var rm = (PMO.program || {}).revenueModel || [];
    var totals = (PMO.program || {}).revenueTotals || {};
    var runRate = totals.monthlyRunRate ||
      rm.reduce(function (a, b) { return a + (b.monthlyRevenue || 0); }, 0);
    var auditedMonthly = Math.round(2460000 / 18);

    return '<div class="widget">' +
      '<div class="w-head"><div style="flex:1">' +
        '<div class="w-title">Revenue Growth — Direct Channel Run-Rate</div>' +
        '<div class="w-sub">Month 12 model · Phase 11 financial run-rate</div>' +
      '</div><span class="pill accent">Modelled</span></div>' +
      '<div class="w-val">' + PMO.inrShort(runRate) + '<span style="font-size:13px;' +
        'font-weight:600;color:var(--ink-3)"> / month</span></div>' +
      '<div class="w-delta kpi-trend up">▲ ' + PMO.inrShort(totals.annualised || runRate * 12) +
        ' annualised gross direct run-rate</div>' +
      '<div style="margin-top:13px;display:flex;flex-direction:column;gap:8px">' +
        rm.map(function (r, i) {
          var share = runRate ? (r.monthlyRevenue / runRate) * 100 : 0;
          return '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:10.5px;' +
              'color:var(--ink-3);margin-bottom:3px">' +
              '<span>' + esc(UI.truncate(r.stream, 34)) + '</span>' +
              '<strong style="color:var(--ink-2)">' + PMO.inrShort(r.monthlyRevenue) + '</strong>' +
            '</div>' +
            '<span class="mini-track" style="display:block"><i class="mini-fill" style="width:' +
              share.toFixed(1) + '%;background:' + [C.s1, C.s2, C.s3][i % 3] + '"></i></span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="w-foot"><div><span class="l">Audited baseline</span><span class="v">' +
        PMO.inrShort(auditedMonthly) + ' / mo</span></div>' +
        '<div style="text-align:right"><span class="l">Basis</span><span class="v">' +
        'All-channel → direct</span></div></div>' +
      '<div class="muted" style="font-size:9.5px;color:var(--ink-4);margin-top:8px;line-height:1.4">' +
        'Baseline is the audited 18-month all-channel average (₹24.6L / 18). The target is ' +
        'direct-channel only — the two are not like-for-like.</div>' +
    '</div>';
  }

  function adPerformanceWidget() {
    var lib = PMO.library || {};
    var meta = (lib.metaCampaigns || []).reduce(function (a, b) { return a + (b.budget || 0); }, 0);
    var google = (lib.googleCampaigns || []).reduce(function (a, b) { return a + (b.budget || 0); }, 0);
    var total = meta + google;
    var roas = ((PMO.program || {}).kpiTargets || []).filter(function (k) {
      return /roas/i.test(k.metric);
    })[0];

    return '<div class="widget">' +
      '<div class="w-head"><div style="flex:1">' +
        '<div class="w-title">Ad Performance — Committed Monthly Media</div>' +
        '<div class="w-sub">Meta + Google combined working budget</div>' +
      '</div><span class="pill accent">' + ((lib.metaCampaigns || []).length +
        (lib.googleCampaigns || []).length) + ' campaigns</span></div>' +
      '<div class="w-val">' + PMO.inrShort(total) + '<span style="font-size:13px;font-weight:600;' +
        'color:var(--ink-3)"> / month</span></div>' +
      '<div class="w-delta kpi-trend up">▲ ' + PMO.inrShort(total * 12) +
        ' committed across the 12-month programme</div>' +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:9px">' +
        splitRow('Meta (Facebook & Instagram)', meta, total, C.s1) +
        splitRow('Google Search & Performance Max', google, total, C.s2) +
      '</div>' +
      '<div class="w-foot">' +
        '<div><span class="l">Blended ROAS now</span><span class="v">' +
          esc(roas ? roas.current : '—') + '</span></div>' +
        '<div style="text-align:right"><span class="l">M12 goal</span><span class="v">' +
          esc(roas ? roas.m12 : '—') + '</span></div>' +
      '</div>' +
    '</div>';
  }

  function splitRow(label, value, total, color) {
    var share = total ? (value / total) * 100 : 0;
    return '<div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--ink-3);' +
        'margin-bottom:3px"><span>' + esc(label) + '</span>' +
        '<strong style="color:var(--ink-2)">' + PMO.inr(value) + ' · ' +
        Math.round(share) + '%</strong></div>' +
      '<span class="mini-track" style="display:block"><i class="mini-fill" style="width:' +
        share.toFixed(1) + '%;background:' + color + '"></i></span>' +
    '</div>';
  }

  /* ---------- charts ------------------------------------------------------- */

  function mountCharts() {
    if (typeof Chart === 'undefined') return;
    var lib = PMO.library || {};
    var prog = PMO.program || {};

    /* 1. Revenue by stream — single series, one hue, no legend (title names it). */
    UI.drawChart('c-revenue', {
      type: 'bar',
      data: {
        labels: (prog.revenueModel || []).map(function (r) { return UI.wrapLabel(r.stream, 26, 3); }),
        datasets: [{
          data: (prog.revenueModel || []).map(function (r) { return r.monthlyRevenue; }),
          backgroundColor: C.s1, borderRadius: 4, borderSkipped: false, barThickness: 22
        }]
      },
      options: UI.barOpts(function (v) { return PMO.inrShort(v); })
    });

    /* 2. Paid media allocation — two platforms, identity carried by colour AND
          the grouped ordering, with the split restated in the card subtitle. */
    var camps = (lib.metaCampaigns || []).map(function (c) {
      return { label: String(c.name).replace(/^Campaign \d+:\s*/, ''), v: c.budget, p: 'Meta' };
    }).concat((lib.googleCampaigns || []).map(function (c) {
      return { label: c.theme, v: c.budget, p: 'Google' };
    }));
    UI.drawChart('c-media', {
      type: 'bar',
      data: {
        labels: camps.map(function (c) { return UI.wrapLabel(c.p + ' \u00b7 ' + c.label, 34, 2); }),
        datasets: [{
          data: camps.map(function (c) { return c.v; }),
          backgroundColor: camps.map(function (c) { return c.p === 'Meta' ? C.s1 : C.s2; }),
          borderRadius: 4, borderSkipped: false, barThickness: 15
        }]
      },
      options: UI.barOpts(function (v) { return PMO.inr(v); })
    });

    /* 3. Keyword portfolio by cluster — single series, one hue. */
    UI.drawChart('c-keywords', {
      type: 'bar',
      data: {
        labels: (lib.keywordClusters || []).map(function (c) { return UI.wrapLabel(c.cluster, 26, 2); }),
        datasets: [{
          data: (lib.keywordClusters || []).map(function (c) { return c.totalVolume; }),
          backgroundColor: C.s1, borderRadius: 4, borderSkipped: false, barThickness: 20
        }]
      },
      options: UI.barOpts(function (v) { return PMO.num(v) + '/mo'; })
    });
  }

  /* ---------- page --------------------------------------------------------- */

  PMO.views = PMO.views || {};
  PMO.views.kpis = {
    title: 'Client KPI Dashboard',
    crumb: 'Performance & Outcomes',
    render: function () {
      var prog = PMO.program || {};
      var targets = prog.kpiTargets || [];
      var lib = PMO.library || {};

      var meters = targets.map(function (k) {
        return meterWidget({
          label: k.metric, baseline: k.baseline, m6: k.m6, m12: k.m12,
          current: k.current, pctToGoal: k.pctToGoal, source: k.source
        });
      }).join('');

      var revenueTable = UI.table([
        { label: 'Revenue Stream', render: function (r) { return '<strong>' + esc(r.stream) + '</strong>'; } },
        { label: 'Volume', key: 'volume' },
        { label: 'AOV', cls: 'num nowrap', render: function (r) { return PMO.inr(r.aov); } },
        { label: 'Monthly Revenue', cls: 'num nowrap', render: function (r) {
          return '<strong>' + PMO.inr(r.monthlyRevenue) + '</strong>';
        } },
        { label: 'Margin Profile', key: 'margin' }
      ], prog.revenueModel || []);

      return '<div class="note" style="margin-bottom:16px">' +
          '<b>Client-facing outcome view.</b> Every meter runs from the audited Month 0 baseline to ' +
          'the Month 12 strategic goal, with the Month 6 checkpoint marked in orange. Figures are ' +
          'sourced from the platforms named under each title; reporting date ' +
          esc(PMO.fmtDate(prog.asOf)) + '.' +
        '</div>' +

        UI.sectionTitle('Headline Commercial Outcomes') +
        '<div class="grid g3">' + revenueWidget() + adPerformanceWidget() +
          meterWidget(pickMeter(targets, /roas/i, 'Blended Paid Advertising ROAS')) + '</div>' +

        UI.sectionTitle('Performance Meters', targets.length + ' tracked metrics') +
        '<div class="grid g3">' + meters + '</div>' +

        UI.sectionTitle('Commercial Model') +
        '<div class="grid g2">' +
          UI.chartCard('c-revenue', 'Month 12 Direct Revenue Run-Rate by Stream',
            'Projected monthly direct revenue · Phase 11 financial model', 190, revenueTable) +
          UI.chartCard('c-keywords', 'Search Demand Captured by Keyword Cluster',
            'Combined monthly search volume of the ' +
            ((lib.keywords || []).length) + ' target keywords', 190) +
        '</div>' +

        UI.sectionTitle('Paid Media Allocation') +
        UI.chartCard('c-media', 'Committed Monthly Budget by Campaign',
          'Blue = Meta (Facebook & Instagram) · Orange = Google Search & Performance Max',
          420) +

        UI.sectionTitle('KPI Model — Full Table') +
        UI.card('12-Month KPI Targets', 'Source: Phase 11 — KPI Dashboard',
          UI.table([
            { label: 'Strategic Metric', render: function (r) {
              return '<strong>' + esc(r.metric) + '</strong>';
            } },
            { label: 'Baseline (M0)', cls: 'num nowrap', key: 'baseline' },
            { label: 'M6 Target', cls: 'num nowrap', key: 'm6' },
            { label: 'M12 Goal', cls: 'num nowrap', key: 'm12' },
            { label: 'Current', cls: 'num nowrap', render: function (r) {
              return '<strong>' + esc(r.current || '—') + '</strong>';
            } },
            { label: 'Progress to Goal', render: function (r) {
              return UI.miniBar(r.pctToGoal || 0, (r.pctToGoal || 0) >= 90 ? 'ok'
                : ((r.pctToGoal || 0) >= 60 ? '' : 'warn'));
            } },
            { label: 'Tracking Platform', key: 'source' }
          ], targets), { tight: true });
    },
    mount: mountCharts
  };

  function pickMeter(targets, re, fallbackLabel) {
    var t = targets.filter(function (k) { return re.test(k.metric); })[0];
    if (!t) return { label: fallbackLabel, baseline: '—', m6: '—', m12: '—', current: '—' };
    return {
      label: t.metric, baseline: t.baseline, m6: t.m6, m12: t.m12,
      current: t.current, pctToGoal: t.pctToGoal, source: t.source
    };
  }
})(window.PMO);
