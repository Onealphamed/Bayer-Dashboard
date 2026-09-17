/* ==========================================================================
   VIEWS — Global Deliverables Tracker and Risk Register
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  var state = {
    deliv: { status: 'all', phase: 'all', q: '' },
    risk: { status: 'all', phase: 'all', q: '' }
  };

  function phaseFilter(scope, current) {
    return '<div class="f-group">' +
      '<button class="f-btn ' + (current === 'all' ? 'on' : '') +
        '" data-f="' + scope + ':phase:all">All phases</button>' +
      PMO.phases.map(function (p) {
        return '<button class="f-btn ' + (current === p.id ? 'on' : '') +
          '" data-f="' + scope + ':phase:' + p.id + '" title="' + UI.attr(p.name) + '">P' +
          p.number + '</button>';
      }).join('') + '</div>';
  }

  function statusFilter(scope, current, options) {
    return '<div class="f-group">' +
      ['all'].concat(options).map(function (s) {
        return '<button class="f-btn ' + (current === s ? 'on' : '') +
          '" data-f="' + scope + ':status:' + s + '">' +
          (s === 'all' ? 'All' : esc(s)) + '</button>';
      }).join('') + '</div>';
  }

  /* ---------- deliverables ------------------------------------------------- */

  function deliverablesView() {
    var s = state.deliv;
    var all = PMO.allDeliverables;
    var rows = all.filter(function (d) {
      if (s.phase !== 'all' && d.phaseId !== s.phase) return false;
      if (s.status === 'Overdue') { if (!d.overdue) return false; }
      else if (s.status !== 'all' && d.status !== s.status) return false;
      if (s.q) {
        var hay = (d.name + ' ' + d.moduleName + ' ' + (d.owner || '') + ' ' +
          (d.dependency || '')).toLowerCase();
        if (hay.indexOf(s.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var byStatus = {};
    all.forEach(function (d) { byStatus[d.status] = (byStatus[d.status] || 0) + 1; });
    var overdue = all.filter(function (d) { return d.overdue; }).length;
    var delivered = byStatus['Delivered'] || 0;

    var cards = '<div class="grid g6" style="margin-bottom:14px">' +
      UI.kpi({ label: 'Total Deliverables', value: all.length, tone: 'accent',
        sub: 'Across ' + PMO.totals.modules + ' modules' }) +
      UI.kpi({ label: 'Delivered', value: delivered, tone: 'ok',
        sub: (all.length ? Math.round(delivered / all.length * 100) : 0) + '% of the programme scope' }) +
      UI.kpi({ label: 'In Review', value: byStatus['In Review'] || 0, tone: 'prog',
        sub: 'Awaiting client or internal sign-off' }) +
      UI.kpi({ label: 'In Progress', value: byStatus['In Progress'] || 0, tone: 'prog',
        sub: 'Actively in production' }) +
      UI.kpi({ label: 'Pending', value: byStatus['Pending'] || 0,
        sub: 'Scheduled, not yet started' }) +
      UI.kpi({ label: 'Overdue', value: overdue, tone: overdue ? 'block' : null,
        sub: overdue ? 'Past due date and not delivered' : 'Nothing past due' }) +
    '</div>';

    var filters = '<div class="filters">' +
      statusFilter('deliv', s.status,
        ['Delivered', 'In Review', 'In Progress', 'Pending', 'Blocked', 'Overdue']) +
      phaseFilter('deliv', s.phase) +
      '<input class="f-search" id="deliv-q" placeholder="Search deliverables, owners, dependencies…" ' +
        'value="' + UI.attr(s.q) + '"/>' +
      '<span class="f-count">' + rows.length + ' of ' + all.length + ' shown</span>' +
    '</div>';

    var table = UI.table([
      { label: 'Deliverable', render: function (d) {
        return '<strong>' + esc(d.name) + '</strong>' +
          '<div class="muted" style="font-size:11px;margin-top:2px">' +
          '<a href="#/phase/' + esc(d.phaseId) + '">P' + d.phaseNumber + ' · ' +
          esc(d.phaseName) + '</a> → ' + esc(d.moduleName) + '</div>';
      } },
      { label: 'Status', cls: 'nowrap', render: function (d) {
        return UI.delivStatusPill(d.status) +
          (d.overdue ? ' <span class="pill block">overdue</span>' : '');
      } },
      { label: 'Due Date', cls: 'nowrap', render: function (d) {
        return '<span' + (d.overdue ? ' style="color:#b91c1c;font-weight:650"' : '') + '>' +
          esc(PMO.fmtDate(d.due)) + '</span>';
      } },
      { label: 'Owner', cls: 'nowrap', key: 'owner' },
      { label: 'Dependency', render: function (d) {
        return '<span class="muted">' + esc(d.dependency || '—') + '</span>';
      } },
      { label: 'Priority', cls: 'nowrap', render: function (d) { return UI.priority(d.priority); } }
    ], rows, { empty: 'No deliverables match the current filters.' });

    return cards + filters +
      UI.card('Deliverables Tracker',
        'Every deliverable across all ' + PMO.phases.length + ' phases, with owner, due date and dependency',
        table, { tight: true });
  }

  /* ---------- risks -------------------------------------------------------- */

  function heatmap(risks) {
    var IMPACTS = ['Critical', 'High', 'Medium', 'Low'];
    var PROBS = ['Low', 'Medium', 'High'];
    var grid = {};
    risks.forEach(function (r) {
      if (r.status === 'Closed') return;
      var k = r.impact + '|' + r.probability;
      grid[k] = (grid[k] || 0) + 1;
    });

    var html = '<div class="heat" style="grid-template-columns:78px repeat(3,minmax(0,1fr))">' +
      '<div></div>' + PROBS.map(function (p) {
        return '<div class="heat-col">' + p + ' prob.</div>';
      }).join('');

    IMPACTS.forEach(function (im) {
      html += '<div class="heat-lbl">' + im + '</div>';
      PROBS.forEach(function (pr) {
        var n = grid[im + '|' + pr] || 0;
        var score = ({ Critical: 4, High: 3, Medium: 2, Low: 1 }[im]) *
                    ({ High: 3, Medium: 2, Low: 1 }[pr]);
        var lvl = n === 0 ? 'empty' : PMO.riskLevel(score);
        html += '<div class="heat-cell ' + lvl + '"><b>' + n + '</b><small>' +
          (n === 0 ? 'none' : (lvl === 'empty' ? '' : lvl)) + '</small></div>';
      });
    });
    return html + '</div>';
  }

  function risksView() {
    var s = state.risk;
    var all = PMO.allRisks;
    var rows = all.filter(function (r) {
      if (s.phase !== 'all' && r.phaseId !== s.phase) return false;
      if (s.status !== 'all' && r.status !== s.status) return false;
      if (s.q) {
        var hay = (r.risk + ' ' + r.mitigation + ' ' + r.owner + ' ' + r.id).toLowerCase();
        if (hay.indexOf(s.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var open = all.filter(function (r) { return r.status !== 'Closed'; });
    var critical = open.filter(function (r) { return PMO.riskLevel(r.score) === 'critical'; }).length;
    var high = open.filter(function (r) { return PMO.riskLevel(r.score) === 'high'; }).length;

    var cards = '<div class="grid g6" style="margin-bottom:14px">' +
      UI.kpi({ label: 'Registered Risks', value: all.length, tone: 'accent',
        sub: 'Across all ' + PMO.phases.length + ' delivery phases' }) +
      UI.kpi({ label: 'Open', value: open.length, tone: 'warn',
        sub: (all.length - open.length) + ' closed' }) +
      UI.kpi({ label: 'Critical Exposure', value: critical, tone: critical ? 'block' : null,
        sub: 'Impact × probability score ≥ 9' }) +
      UI.kpi({ label: 'High Exposure', value: high, tone: high ? 'warn' : null,
        sub: 'Score 6 – 8' }) +
      UI.kpi({ label: 'Mitigating', value: open.filter(function (r) {
        return r.status === 'Mitigating';
      }).length, tone: 'prog', sub: 'Active mitigation under way' }) +
      UI.kpi({ label: 'Blocked Tasks', value: PMO.totals.blocked,
        tone: PMO.totals.blocked ? 'block' : null, sub: 'Work stopped on an external dependency' }) +
    '</div>';

    var filters = '<div class="filters">' +
      statusFilter('risk', s.status, ['Open', 'Mitigating', 'Monitoring', 'Closed']) +
      phaseFilter('risk', s.phase) +
      '<input class="f-search" id="risk-q" placeholder="Search risks, mitigations, owners…" ' +
        'value="' + UI.attr(s.q) + '"/>' +
      '<span class="f-count">' + rows.length + ' of ' + all.length + ' shown</span>' +
    '</div>';

    var table = UI.table([
      { label: 'ID', cls: 'nowrap', render: function (r) {
        var lvl = PMO.riskLevel(r.score);
        return '<span class="pill ' + (lvl === 'critical' || lvl === 'high' ? 'block'
          : (lvl === 'medium' ? 'warn' : 'idle')) + '">' + esc(r.id) + '</span>';
      } },
      { label: 'Risk', render: function (r) {
        return '<strong>' + esc(r.risk) + '</strong>' +
          '<div class="muted" style="font-size:11px;margin-top:2px">' +
          '<a href="#/phase/' + esc(r.phaseId) + '">P' + r.phaseNumber + ' · ' +
          esc(r.phaseName) + '</a></div>';
      } },
      { label: 'Impact', cls: 'nowrap', render: function (r) { return UI.priority(r.impact); } },
      { label: 'Probability', cls: 'nowrap', key: 'probability' },
      { label: 'Score', cls: 'num', render: function (r) {
        var lvl = PMO.riskLevel(r.score);
        return '<strong class="prio ' + (lvl === 'critical' ? 'Critical'
          : (lvl === 'high' ? 'High' : (lvl === 'medium' ? 'Medium' : 'Low'))) + '">' +
          r.score + '</strong>';
      } },
      { label: 'Owner', cls: 'nowrap', key: 'owner' },
      { label: 'Mitigation Plan', key: 'mitigation' },
      { label: 'Status', cls: 'nowrap', render: function (r) { return UI.riskStatusPill(r.status); } }
    ], rows, { empty: 'No risks match the current filters.' });

    return cards +
      '<div class="grid g2" style="margin-bottom:14px">' +
        UI.card('Risk Exposure Heatmap', open.length + ' open risks by impact × probability',
          heatmap(all)) +
        UI.card('Exposure by Phase', 'Open risk count and peak severity per phase',
          UI.table([
            { label: 'Phase', render: function (p) {
              return '<a href="#/phase/' + esc(p.id) + '"><strong>P' + p.number + '</strong> ' +
                esc(p.name) + '</a>';
            } },
            { label: 'Open', cls: 'num', render: function (p) {
              return (p.risks || []).filter(function (r) { return r.status !== 'Closed'; }).length;
            } },
            { label: 'Peak Score', cls: 'num', render: function (p) {
              var mx = (p.risks || []).reduce(function (a, r) { return Math.max(a, r.score); }, 0);
              var lvl = PMO.riskLevel(mx);
              return '<span class="pill ' + (lvl === 'critical' || lvl === 'high' ? 'block'
                : (lvl === 'medium' ? 'warn' : 'idle')) + '">' + mx + '</span>';
            } },
            { label: 'Phase Risk Level', cls: 'nowrap', render: function (p) {
              return esc(p.riskLevel || '—');
            } },
            { label: 'Health', cls: 'nowrap', render: function (p) {
              return UI.healthPill(p.health);
            } }
          ], PMO.phases), { tight: true }) +
      '</div>' +
      filters +
      UI.card('Programme Risk Register',
        'All registered risks ranked by impact × probability score',
        table, { tight: true });
  }

  /* ---------- filter wiring ------------------------------------------------ */

  function wire(root) {
    root.querySelectorAll('[data-f]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-f').split(':');
        state[parts[0]][parts[1]] = parts[2];
        PMO.rerender();
      });
    });
    ['deliv-q', 'risk-q'].forEach(function (id) {
      var el = root.querySelector('#' + id);
      if (!el) return;
      var key = id.split('-')[0];
      el.addEventListener('input', debounce(function () {
        state[key].q = el.value;
        PMO.rerender(function (r) {
          var again = r.querySelector('#' + id);
          if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
        });
      }, 180));
    });
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  PMO.views = PMO.views || {};
  PMO.views.deliverables = {
    title: 'Deliverables Tracker',
    crumb: 'Delivery Governance',
    render: deliverablesView,
    mount: function (root) { wire(root); }
  };
  PMO.views.risks = {
    title: 'Risk Register',
    crumb: 'Delivery Governance',
    render: risksView,
    mount: function (root) { wire(root); }
  };
})(window.PMO);
