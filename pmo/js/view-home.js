/* ==========================================================================
   VIEW — Dashboard Home (executive overview)
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  function overviewCard() {
    var p = PMO.program || {};
    var h = PMO.health;
    var t = PMO.totals;

    return '<div class="phase-hero h-' + esc(h.state) + '">' +
      '<div class="ph-top">' +
        '<div style="flex:1;min-width:280px">' +
          '<span class="ph-num">Programme</span>' +
          '<div class="ph-name" style="margin-top:8px">' + esc(p.projectName || 'Digital Marketing Growth Plan') + '</div>' +
          '<div class="ph-sub">' + esc(p.businessName || '') +
            (p.businessDescriptor ? ' · ' + esc(p.businessDescriptor) : '') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">' +
          kv('Programme Window', PMO.fmtDate(p.programStart) + ' → ' + PMO.fmtDate(p.programEnd)) +
          kv('Reporting As Of', PMO.fmtDate(p.asOf)) +
          kv('Elapsed', Math.round(PMO.elapsedPct) + '% of 12 months') +
          '<div><div class="kpi-l" style="margin-bottom:6px">Project Health</div>' +
            UI.healthPill(h.state) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ph-body">' +
        '<div>' +
          '<h4>Engagement Basis</h4>' +
          '<p>' + esc(p.engagementModel || '') + '. ' + esc(p.auditBasis || '') + '. ' +
            'The programme converts the audited diagnostic into ' + t.phases + ' delivery phases, ' +
            t.modules + ' modules and ' + t.tasks + ' tracked tasks across a 12-month horizon.</p>' +
        '</div>' +
        '<div>' +
          '<h4>Health Commentary</h4>' +
          '<p>' + esc(h.note) + ' Delivery is at <b>' + t.progress + '%</b> against <b>' +
            Math.round(PMO.elapsedPct) + '%</b> of the schedule elapsed' +
            (h.schedulePressure > 0
              ? ' — a <b>' + Math.round(h.schedulePressure) + ' point</b> schedule variance.'
              : ' — delivery is ahead of the schedule curve.') + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function kv(l, v) {
    return '<div><div class="kpi-l" style="margin-bottom:4px">' + esc(l) + '</div>' +
      '<div style="font-size:13px;font-weight:650;color:var(--ink-2)">' + esc(v) + '</div></div>';
  }

  function kpiCards() {
    var t = PMO.totals;
    var et = (PMO.program && PMO.program.executiveTargets) || {};
    function target(k, fallbackLabel) {
      var o = et[k] || {};
      return { value: o.value || '—', sub: o.detail || fallbackLabel };
    }
    var traffic = target('trafficGrowth', 'Organic traffic growth to Month 12');
    var leads = target('expectedLeads', 'Qualified leads at Month 12');
    var rev = target('revenueImpact', 'Projected monthly revenue impact');
    var roi = target('expectedRoi', 'Blended return on ad spend');

    var cards = [
      UI.kpi({ label: 'Total Phases', value: t.phases, tone: 'accent',
        sub: PMO.health.greens + ' green · ' + PMO.health.ambers + ' amber · ' + PMO.health.reds + ' red' }),
      UI.kpi({ label: 'Total Modules', value: t.modules, tone: 'accent',
        sub: 'Workstreams under active governance' }),
      UI.kpi({ label: 'Total Tasks', value: PMO.num(t.tasks), tone: 'accent',
        sub: t.deliverables + ' deliverables tracked' }),
      UI.kpi({ label: 'Completed Tasks', value: PMO.num(t.completed), tone: 'ok',
        sub: (t.tasks ? Math.round(t.completed / t.tasks * 100) : 0) + '% of total scope' }),
      UI.kpi({ label: 'In Progress', value: PMO.num(t.inProgress), tone: 'prog',
        sub: 'Active in Month ' + UI.currentMonthN() + ' of 12' }),
      UI.kpi({ label: 'Pending Tasks', value: PMO.num(t.pending), tone: null,
        sub: 'Queued for the remaining programme window' }),
      UI.kpi({ label: 'Blocked Tasks', value: PMO.num(t.blocked), tone: t.blocked ? 'block' : null,
        sub: t.blocked ? 'Awaiting external dependency resolution' : 'No external blockers' }),
      UI.kpi({ label: 'Overall Completion', tone: t.progress >= 70 ? 'ok' : 'warn',
        html: t.progress + '%', sub: t.overdue + ' task' + (t.overdue === 1 ? '' : 's') + ' overdue' }),
      UI.kpi({ label: 'Expected Traffic Growth', value: traffic.value, tone: 'ok', small: true, sub: traffic.sub }),
      UI.kpi({ label: 'Expected Leads', value: leads.value, tone: 'ok', small: true, sub: leads.sub }),
      UI.kpi({ label: 'Expected Revenue Impact', value: rev.value, tone: 'ok', small: true, sub: rev.sub }),
      UI.kpi({ label: 'Expected ROI', value: roi.value, tone: 'ok', small: true, sub: roi.sub })
    ];
    return '<div class="grid g6">' + cards.join('') + '</div>';
  }

  function healthPanel() {
    var rows = PMO.phases.map(function (p) {
      var pressure = Math.round(PMO.elapsedPct - p.progress);
      return '<tr>' +
        '<td class="nowrap"><a href="#/phase/' + esc(p.id) + '"><strong>P' + p.number + '</strong> ' +
          esc(p.name) + '</a></td>' +
        '<td style="width:150px">' + UI.progressBar(p) + '</td>' +
        '<td class="num">' + p.moduleCount + '</td>' +
        '<td class="num">' + p.counts.total + '</td>' +
        '<td class="num">' + p.counts.completed + '</td>' +
        '<td class="num">' + p.counts.inProgress + '</td>' +
        '<td class="num">' + p.counts.blocked + '</td>' +
        '<td class="num">' + (p.counts.overdue
          ? '<span class="pill block">' + p.counts.overdue + '</span>' : '<span class="muted">0</span>') + '</td>' +
        '<td class="nowrap">' + UI.healthPill(p.health) + '</td>' +
        '<td class="nowrap"><span class="pill ' + (p.riskLevel === 'High' ? 'block'
          : (p.riskLevel === 'Medium' ? 'warn' : 'idle')) + '">' + esc(p.riskLevel || '—') + ' risk</span></td>' +
        '<td class="num ' + (pressure > 12 ? '' : 'muted') + '" style="' +
          (pressure > 12 ? 'color:#b91c1c;font-weight:650' : '') + '">' +
          (pressure > 0 ? '-' + pressure : '+' + Math.abs(pressure)) + ' pts</td>' +
      '</tr>';
    }).join('');

    var head = '<thead><tr>' +
      ['Phase', 'Progress', 'Modules', 'Tasks', 'Done', 'Active', 'Blocked', 'Overdue',
       'Health', 'Risk', 'Schedule Var.'].map(function (h, i) {
        return '<th class="' + (i >= 2 && i <= 7 ? 'num' : '') + '">' + h + '</th>';
      }).join('') + '</tr></thead>';

    return UI.card('Phase Health Matrix',
      'Nine delivery phases scored against plan as of ' + PMO.fmtDate(PMO.program.asOf),
      '<div class="dt-wrap"><table class="dt">' + head + '<tbody>' + rows + '</tbody></table></div>',
      { tight: true, right: UI.healthPill(PMO.health.state) });
  }

  function executiveTimeline() {
    var p = PMO.program || {};
    var roadmap = p.roadmap || [];
    var months = PMO.months();
    var nowN = UI.currentMonthN();
    if (!roadmap.length) return '';

    var lanes = [
      { key: 'seo', label: 'SEO & Technical', color: '#2563eb' },
      { key: 'content', label: 'Content & Social', color: '#7c3aed' },
      { key: 'paid', label: 'Paid Media', color: '#d97706' },
      { key: 'local', label: 'Local SEO & Outreach', color: '#2f9e44' }
    ];

    var head = '<thead><tr><th class="lane">Workstream</th>' + months.map(function (m) {
      return '<th class="mcell' + (m.n === nowN ? ' is-now' : '') + '">' +
        '<span class="m-n">M' + m.n + '</span>' +
        '<span class="m-y">' + esc(m.short) + ' ' + String(m.year).slice(2) + '</span></th>';
    }).join('') + '</tr></thead>';

    var body = '<tbody>' + lanes.map(function (ln) {
      return '<tr><td class="lane"><span class="swatch" style="background:' + ln.color + '"></span>' +
        esc(ln.label) + '</td>' +
        months.map(function (m) {
          var row = roadmap.filter(function (r) { return r.month === m.n; })[0] || {};
          return '<td class="mcell' + (m.n === nowN ? ' is-now' : '') + '">' +
            esc(row[ln.key] || '—') + '</td>';
        }).join('') + '</tr>';
    }).join('') + '</tbody>';

    return UI.card('Executive Timeline — 12-Month Roadmap',
      'Cross-functional execution plan, Month 1 (Oct 2025) through Month 12 (Sep 2026)',
      '<div class="swim"><table class="dt">' + head + body + '</table></div>',
      { tight: true,
        right: '<span class="chip">Now: Month ' + nowN + '</span>' });
  }

  function milestonePanel() {
    var ms = ((PMO.program || {}).milestones || []).slice();
    ms.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    var rows = ms.map(function (m) {
      var ph = PMO.phaseById[m.phase];
      return '<tr>' +
        '<td class="nowrap"><strong>' + esc(PMO.fmtDate(m.date)) + '</strong>' +
          '<div class="muted" style="font-size:10.5px">Month ' + (m.month || '—') + '</div></td>' +
        '<td><strong>' + esc(m.name) + '</strong>' +
          (m.description ? '<div class="muted" style="font-size:11px;margin-top:2px">' +
            esc(m.description) + '</div>' : '') + '</td>' +
        '<td class="nowrap">' + (ph ? '<a href="#/phase/' + esc(ph.id) + '">P' + ph.number + ' · ' +
          esc(UI.truncate(ph.name, 22)) + '</a>' : '<span class="muted">—</span>') + '</td>' +
        '<td class="nowrap">' + esc(m.owner || '—') + '</td>' +
        '<td class="nowrap">' + UI.statusPill(m.status) + '</td>' +
      '</tr>';
    }).join('');

    return UI.card('Programme Milestones', ms.length + ' governance checkpoints across the 12-month plan',
      '<div class="dt-wrap dt-scroll"><table class="dt"><thead><tr>' +
        '<th>Date</th><th>Milestone</th><th>Phase</th><th>Owner</th><th>Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>', { tight: true });
  }

  function topRisks() {
    var risks = PMO.allRisks.filter(function (r) { return r.status !== 'Closed'; }).slice(0, 8);
    var rows = risks.map(function (r) {
      var lvl = PMO.riskLevel(r.score);
      return '<tr>' +
        '<td class="nowrap"><span class="pill ' + (lvl === 'critical' || lvl === 'high' ? 'block'
          : (lvl === 'medium' ? 'warn' : 'idle')) + '">' + esc(r.id) + '</span></td>' +
        '<td><strong>' + esc(r.risk) + '</strong>' +
          '<div class="muted" style="font-size:11px;margin-top:3px">Mitigation: ' +
            esc(r.mitigation) + '</div></td>' +
        '<td class="nowrap"><a href="#/phase/' + esc(r.phaseId) + '">P' + r.phaseNumber + '</a></td>' +
        '<td class="nowrap">' + esc(r.impact) + ' / ' + esc(r.probability) + '</td>' +
        '<td class="nowrap">' + esc(r.owner) + '</td>' +
        '<td class="nowrap">' + UI.riskStatusPill(r.status) + '</td>' +
      '</tr>';
    }).join('');

    return UI.card('Top Programme Risks',
      PMO.totals.risksOpen + ' open of ' + PMO.totals.risks + ' registered, ranked by impact × probability',
      '<div class="dt-wrap"><table class="dt"><thead><tr>' +
        '<th>ID</th><th>Risk</th><th>Phase</th><th>Impact / Prob.</th><th>Owner</th><th>Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>',
      { tight: true, right: '<a class="phase-open-link" href="#/risks">Full register →</a>' });
  }

  function phaseBoard() {
    return '<div class="filters" style="margin-bottom:10px">' +
        '<div class="f-group">' +
          '<button class="f-btn" data-board="expand">Expand all</button>' +
          '<button class="f-btn" data-board="collapse">Collapse all</button>' +
        '</div>' +
        '<span class="f-count">' + PMO.phases.length + ' phases \u00b7 ' +
          PMO.totals.modules + ' modules \u00b7 ' + PMO.totals.tasks + ' tasks</span>' +
      '</div>' +
      PMO.phases.map(function (p) {
        return UI.phaseBlock(p, { showExtra: false });
      }).join('');
  }

  PMO.views = PMO.views || {};
  PMO.views.home = {
    title: 'Dashboard Home',
    crumb: 'Programme Overview',
    render: function () {
      return overviewCard() +
        UI.sectionTitle('Executive KPI Summary') +
        kpiCards() +
        UI.sectionTitle('Project Health') +
        healthPanel() +
        UI.sectionTitle('Executive Timeline') +
        executiveTimeline() +
        UI.sectionTitle('Phase & Module Delivery Board', PMO.totals.modules + ' modules') +
        phaseBoard() +
        UI.sectionTitle('Milestones & Risk') +
        '<div class="grid g2">' + milestonePanel() + topRisks() + '</div>';
    },
    mount: function (root) {
      root.querySelectorAll('[data-board]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var collapse = btn.getAttribute('data-board') === 'collapse';
          root.querySelectorAll('.phase-block').forEach(function (b) {
            b.classList.toggle('collapsed', collapse);
          });
        });
      });
    }
  };
})(window.PMO);
