/* ==========================================================================
   VIEW — Business Intelligence (the audited baseline the programme is built on)
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  var C = UI.CHART;          /* shared validated palette slots */

  function baselineTiles(intel) {
    return '<div class="grid g4">' + (intel.baseline || []).map(function (b) {
      return UI.kpi({ label: b.label, value: b.value, tone: 'accent', small: String(b.value).length > 9 });
    }).join('') + '</div>';
  }

  function insights(intel) {
    if (!intel.insights || !intel.insights.length) return '';
    return UI.sectionTitle('Strategic Implications', intel.insights.length) +
      '<div class="grid g3">' + intel.insights.map(function (i) {
        var ph = PMO.phaseById[i.phase];
        return '<div class="widget">' +
          '<div class="w-head"><div style="flex:1">' +
            '<div class="w-title">' + esc(i.title) + '</div></div>' +
            (ph ? '<a class="pill accent" href="#/phase/' + esc(ph.id) + '">P' + ph.number + '</a>' : '') +
          '</div>' +
          '<p style="font-size:12px;color:var(--ink-2);line-height:1.55">' + esc(i.detail) + '</p>' +
          '<div class="w-foot" style="display:block">' +
            '<span class="l">Programme Implication</span>' +
            '<div style="font-size:11.5px;color:var(--ink-2);line-height:1.5;margin-top:3px">' +
              esc(i.implication) + '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  function render() {
    var intel = PMO.intel;
    if (!intel) return '<div class="empty-state">Business intelligence data not loaded.</div>';

    var geoTable = UI.table([
      { label: 'Delivery Location Cluster', render: function (r) {
        return '<strong>' + esc(r.cluster) + '</strong>';
      } },
      { label: 'Audited Sales', cls: 'num nowrap', render: function (r) { return PMO.inr(r.sales); } },
      { label: 'Share', cls: 'num nowrap', render: function (r) { return r.sharePct + '%'; } },
      { label: 'Strategic Significance & Direct Marketing Action', key: 'action' },
      { label: 'Owning Phase', cls: 'nowrap', render: function (r) {
        var p = PMO.phaseById[r.phase];
        return p ? '<a href="#/phase/' + esc(p.id) + '">P' + p.number + ' · ' +
          esc(UI.truncate(p.name, 20)) + '</a>' : '<span class="muted">—</span>';
      } }
    ], intel.geoClusters || []);

    var menuTable = UI.table([
      { label: 'Category', render: function (r) { return '<strong>' + esc(r.category) + '</strong>'; } },
      { label: 'Historical Sales', cls: 'num nowrap', render: function (r) { return PMO.inr(r.sales); } },
      { label: 'Share', cls: 'num nowrap', render: function (r) { return r.sharePct + '%'; } },
      { label: 'Distinct Dishes', cls: 'num', key: 'dishes' },
      { label: 'Commercial Nature & Operational Strategy', key: 'strategy' }
    ], intel.menuCategories || []);

    return '<div class="note" style="margin-bottom:16px">' +
        '<b>' + esc((intel.headline || {}).title || 'Audited Baseline') + '.</b> ' +
        esc((intel.headline || {}).subtitle || '') + ' Source: ' +
        esc((intel.headline || {}).source || '') + '. Every figure below is empirical — the ' +
        'programme’s phases, budgets and creative directives are derived from it.' +
      '</div>' +

      UI.sectionTitle('Audited Historical KPI Baseline') +
      baselineTiles(intel) +

      insights(intel) +

      UI.sectionTitle('Geographic Concentration & Turf Audit',
        (intel.geoClusters || []).length + ' clusters') +
      '<div class="grid g2">' +
        UI.chartCard('c-geo', 'Audited Sales by Delivery Cluster',
          'Emerald Isle (Powai) is the home-turf anchor', 300) +
        UI.card('Cluster Detail', 'Marketing action by cluster, mapped to the owning phase',
          geoTable, { tight: true }) +
      '</div>' +

      UI.sectionTitle('Customer Retention & Cohort Breakdown') +
      '<div class="grid g2">' +
        UI.chartCard('c-loyalty', 'Revenue by Order-Frequency Band',
          'The top 15 mega-loyalists carry a disproportionate share of sales', 260,
          UI.table([
            { label: 'Loyalty Band', render: function (r) {
              return '<strong>' + esc(r.band) + '</strong>';
            } },
            { label: 'Customers', cls: 'num', key: 'customers' },
            { label: 'Revenue', cls: 'num nowrap', render: function (r) { return PMO.inr(r.revenue); } },
            { label: 'Share', cls: 'num nowrap', render: function (r) { return r.sharePct + '%'; } },
            { label: 'Mandatory Intervention', key: 'intervention' }
          ], intel.loyaltyBands || [])) +
        UI.card('Recency Cohorts — The Dormant Regulars',
          'Active, going quiet and lapsed segments with the mandated intervention',
          UI.table([
            { label: 'Cohort', render: function (r) {
              return '<strong>' + esc(r.cohort) + '</strong>';
            } },
            { label: 'Customers', cls: 'num', key: 'customers' },
            { label: 'Revenue', cls: 'num nowrap', render: function (r) { return PMO.inr(r.revenue); } },
            { label: 'Share', cls: 'num nowrap', render: function (r) { return r.sharePct + '%'; } },
            { label: 'Status', cls: 'nowrap', render: function (r) {
              var cls = /healthy|active/i.test(r.status) ? 'ok'
                : (/risk|quiet/i.test(r.status) ? 'warn' : 'block');
              return '<span class="pill ' + cls + '">' + esc(r.status) + '</span>';
            } },
            { label: 'Intervention', key: 'intervention' }
          ], intel.recencyCohorts || []), { tight: true }) +
      '</div>' +

      UI.sectionTitle('Menu Engineering & Revenue Mix',
        (intel.menuCategories || []).length + ' categories') +
      '<div class="grid g2">' +
        UI.chartCard('c-menu', 'Historical Sales by Menu Category',
          'Fish & Seafood and Catering are the two commercial engines', 320) +
        UI.card('Category Detail', 'Commercial nature and operational strategy per category',
          menuTable, { tight: true }) +
      '</div>' +

      UI.sectionTitle('Retention Hooks & Basket Pairings') +
      '<div class="grid g2">' +
        UI.card('100% Repeat-Hook Dishes',
          'Mandatory in cold-acquisition creative — every first order converted to a repeat',
          UI.table([
            { label: 'Dish', render: function (r) { return '<strong>' + esc(r.dish) + '</strong>'; } },
            { label: 'First Orders', cls: 'num', key: 'firstOrders' },
            { label: 'Repeat Rate', cls: 'num nowrap', render: function (r) {
              return '<span class="pill ' + (r.repeatPct >= 100 ? 'ok' : 'prog') + '">' +
                r.repeatPct + '%</span>';
            } },
            { label: 'Creative Advertising Directive', key: 'directive' }
          ], intel.repeatHooks || []), { tight: true }) +
        UI.card('Empirical Basket Pairings',
          'Verified co-ordered pairs packaged as commercial bundles and ad sets',
          UI.table([
            { label: 'Co-Ordered Pair', render: function (r) {
              return '<strong>' + esc(r.pair) + '</strong>';
            } },
            { label: 'Co-Orders', cls: 'num', key: 'coOrders' },
            { label: 'Commercial Bundle', key: 'bundle' },
            { label: 'Meal Slot', key: 'slot' },
            { label: 'Expected AOV', cls: 'num nowrap', render: function (r) {
              return '<strong>' + PMO.inr(r.aov) + '</strong>';
            } }
          ], intel.basketPairings || []), { tight: true }) +
      '</div>' +

      UI.sectionTitle('Competitive Landscape', (intel.competitors || []).length + ' competitors') +
      UI.card('Mumbai Competitive Landscape & Market Gap Analysis',
        'Source sheet: Phase 2 — Competitor Analysis',
        UI.table([
          { label: 'Competitor', render: function (r) {
            return '<strong>' + esc(r.name) + '</strong>' +
              '<div class="muted" style="font-size:11px;margin-top:2px">' + esc(r.model) + '</div>';
          } },
          { label: 'Threat', cls: 'nowrap', render: function (r) {
            return '<span class="pill ' + (r.threat === 'High' ? 'block'
              : (r.threat === 'Medium' ? 'warn' : 'idle')) + '">' + esc(r.threat) + '</span>';
          } },
          { label: 'SEO & Organic Footprint', key: 'seo' },
          { label: 'Local SEO & GBP', key: 'local' },
          { label: 'Social & Meta Ads', key: 'social' },
          { label: 'Vulnerabilities & Blind Spots', key: 'vulnerabilities' },
          { label: 'Howrah Bridge Attack Strategy', render: function (r) {
            return '<strong>' + esc(r.attack) + '</strong>';
          } }
        ], intel.competitors || []), { tight: true });
  }

  function mount() {
    if (typeof Chart === 'undefined' || !PMO.intel) return;
    var intel = PMO.intel;
    var money = function (v) { return PMO.inrShort(v); };

    UI.drawChart('c-geo', {
      type: 'bar',
      data: {
        labels: (intel.geoClusters || []).map(function (g) { return UI.wrapLabel(g.cluster, 24, 2); }),
        datasets: [{ data: (intel.geoClusters || []).map(function (g) { return g.sales; }),
          backgroundColor: C.s1, borderRadius: 4, borderSkipped: false, barThickness: 16 }]
      },
      options: UI.barOpts(money)
    });

    UI.drawChart('c-loyalty', {
      type: 'bar',
      data: {
        labels: (intel.loyaltyBands || []).map(function (b) { return UI.wrapLabel(b.band, 22, 2); }),
        datasets: [{ data: (intel.loyaltyBands || []).map(function (b) { return b.revenue; }),
          backgroundColor: C.s1, borderRadius: 4, borderSkipped: false, barThickness: 16 }]
      },
      options: UI.barOpts(money)
    });

    UI.drawChart('c-menu', {
      type: 'bar',
      data: {
        labels: (intel.menuCategories || []).map(function (m) { return UI.wrapLabel(m.category, 22, 2); }),
        datasets: [{ data: (intel.menuCategories || []).map(function (m) { return m.sales; }),
          backgroundColor: C.s1, borderRadius: 4, borderSkipped: false, barThickness: 15 }]
      },
      options: UI.barOpts(money)
    });
  }

  PMO.views = PMO.views || {};
  PMO.views.intel = {
    title: 'Business Intelligence',
    crumb: 'Audited Diagnostic',
    render: render,
    mount: mount
  };
})(window.PMO);
