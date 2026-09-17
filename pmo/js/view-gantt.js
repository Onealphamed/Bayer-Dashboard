/* ==========================================================================
   VIEW — Master Marketing Gantt (all workstreams, Month 1 -> Month 12)
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  /* Workstream lanes, per the programme operating model. */
  var LANES = [
    { key: 'seo',     label: 'SEO & Technical Foundation', phases: ['p1', 'p2'], color: '#2563eb' },
    { key: 'content', label: 'Content Marketing',          phases: ['p3'],       color: '#7c3aed' },
    { key: 'gbp',     label: 'Local SEO & GBP',            phases: ['p4'],       color: '#2f9e44' },
    { key: 'meta',    label: 'Meta Ads',                   phases: ['p5'],       color: '#0891b2' },
    { key: 'google',  label: 'Google Ads',                 phases: ['p6'],       color: '#d97706' },
    { key: 'links',   label: 'Link Building & PR',         phases: ['p7'],       color: '#be185d' },
    { key: 'cro',     label: 'Conversion Optimization',    phases: ['p8'],       color: '#ea580c' },
    { key: 'report',  label: 'Reporting & Analytics',      phases: ['p9'],       color: '#475569' }
  ];

  function groups() {
    var out = [];
    LANES.forEach(function (ln) {
      ln.phases.forEach(function (pid) {
        var ph = PMO.phaseById[pid];
        if (!ph) return;
        out.push({
          label: ln.label + (ln.phases.length > 1 ? ' — ' + ph.name : ''),
          number: ph.number,
          color: ln.color,
          progress: ph.progress,
          modules: ph.modules || []
        });
      });
    });
    return out;
  }

  function summary() {
    var t = PMO.totals;
    return '<div class="grid g6" style="margin-bottom:14px">' +
      UI.kpi({ label: 'Workstreams', value: LANES.length, tone: 'accent',
        sub: PMO.phases.length + ' phases · ' + t.modules + ' modules' }) +
      UI.kpi({ label: 'Programme Span', value: '12 months', tone: 'accent',
        sub: PMO.fmtDate(PMO.program.programStart) + ' → ' + PMO.fmtDate(PMO.program.programEnd) }) +
      UI.kpi({ label: 'Elapsed', value: Math.round(PMO.elapsedPct) + '%', tone: 'prog',
        sub: 'Currently in Month ' + UI.currentMonthN() + ' of 12' }) +
      UI.kpi({ label: 'Delivered', value: t.progress + '%', tone: t.progress >= 70 ? 'ok' : 'warn',
        sub: t.completed + ' of ' + t.tasks + ' tasks complete' }) +
      UI.kpi({ label: 'Milestones', value: ((PMO.program.milestones || []).length),
        tone: 'accent',
        sub: (PMO.program.milestones || []).filter(function (m) {
          return m.status === 'completed';
        }).length + ' achieved' }) +
      UI.kpi({ label: 'Dependencies', value: ((PMO.program.dependencies || []).length),
        tone: 'accent', sub: 'Cross-phase hand-offs under governance' }) +
    '</div>';
  }

  function dependencyTable() {
    var deps = (PMO.program || {}).dependencies || [];
    var TYPE = {
      FS: 'Finish → Start', SS: 'Start → Start', FF: 'Finish → Finish'
    };
    var rows = deps.map(function (d) {
      var from = PMO.moduleById[d.from], to = PMO.moduleById[d.to];
      var satisfied = from && (from.status === 'completed' ||
        (d.type === 'SS' && from.status === 'in-progress'));
      return Object.assign({}, d, { _from: from, _to: to, _ok: satisfied });
    });

    return UI.card('Dependency Map', deps.length + ' cross-phase hand-offs governing sequencing',
      UI.table([
        { label: 'Predecessor', render: function (r) {
          return r._from
            ? '<a href="#/phase/' + esc(r._from.phaseId) + '"><strong>P' + r._from.phaseNumber +
              ' · ' + esc(r._from.name) + '</strong></a>' +
              '<div class="muted" style="font-size:11px;margin-top:2px">' +
              UI.statusPill(r._from.status) + '</div>'
            : '<span class="muted">' + esc(r.from) + '</span>';
        } },
        { label: 'Type', cls: 'nowrap', render: function (r) {
          return '<span class="chip">' + esc(TYPE[r.type] || r.type) + '</span>';
        } },
        { label: 'Successor', render: function (r) {
          return r._to
            ? '<a href="#/phase/' + esc(r._to.phaseId) + '"><strong>P' + r._to.phaseNumber +
              ' · ' + esc(r._to.name) + '</strong></a>' +
              '<div class="muted" style="font-size:11px;margin-top:2px">' +
              UI.statusPill(r._to.status) + '</div>'
            : '<span class="muted">' + esc(r.to) + '</span>';
        } },
        { label: 'Governance Note', key: 'note' },
        { label: 'Gate', cls: 'nowrap', render: function (r) {
          return r._ok ? '<span class="pill ok">Satisfied</span>'
            : '<span class="pill warn">Pending predecessor</span>';
        } }
      ], rows, { empty: 'No dependencies registered.' }), { tight: true });
  }

  function milestoneStrip() {
    var ms = ((PMO.program || {}).milestones || []).slice()
      .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    return UI.card('Milestone Schedule', ms.length + ' checkpoints across the programme',
      UI.table([
        { label: 'Milestone', render: function (m) {
          return '<strong>' + esc(m.name) + '</strong>' +
            (m.description ? '<div class="muted" style="font-size:11px;margin-top:2px">' +
              esc(m.description) + '</div>' : '');
        } },
        { label: 'Month', cls: 'nowrap', render: function (m) { return 'M' + (m.month || '—'); } },
        { label: 'Date', cls: 'nowrap', render: function (m) { return esc(PMO.fmtDate(m.date)); } },
        { label: 'Phase', cls: 'nowrap', render: function (m) {
          var ph = PMO.phaseById[m.phase];
          return ph ? '<a href="#/phase/' + esc(ph.id) + '">P' + ph.number + '</a>'
            : '<span class="muted">—</span>';
        } },
        { label: 'Owner', cls: 'nowrap', key: 'owner' },
        { label: 'Status', cls: 'nowrap', render: function (m) { return UI.statusPill(m.status); } }
      ], ms, { empty: 'No milestones registered.' }), { tight: true });
  }

  PMO.views = PMO.views || {};
  PMO.views.gantt = {
    title: 'Master Marketing Gantt',
    crumb: 'Delivery Timeline',
    render: function () {
      return summary() +
        UI.sectionTitle('Master Gantt — All Workstreams, Month 1 to Month 12') +
        UI.card('12-Month Integrated Delivery Schedule',
          'SEO, Content, Local SEO, Meta Ads, Google Ads, Link Building, CRO and Reporting with milestones and the live progress overlay',
          PMO.Gantt.render(groups(), {
            milestones: (PMO.program || {}).milestones || []
          }), { tight: true }) +
        UI.sectionTitle('Dependencies') +
        dependencyTable() +
        UI.sectionTitle('Milestones') +
        milestoneStrip();
    }
  };
})(window.PMO);
