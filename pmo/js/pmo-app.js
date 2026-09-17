/* ==========================================================================
   PMO APP — sidebar, router, module drill-down modal, boot
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  var NAV = [
    { group: 'Programme', items: [
      { route: 'home',         label: 'Dashboard Home',        icon: '▣' },
      { route: 'gantt',        label: 'Master Marketing Gantt', icon: '≡' },
      { route: 'kpis',         label: 'Client KPI Dashboard',  icon: '◔' },
      { route: 'intel',        label: 'Business Intelligence', icon: '⌗' }
    ] },
    { group: 'Governance', items: [
      { route: 'deliverables', label: 'Deliverables Tracker',  icon: '✓' },
      { route: 'risks',        label: 'Risk Register',         icon: '⚠' }
    ] }
  ];

  var current = { route: 'home', arg: null };

  /* ---------- sidebar ------------------------------------------------------ */

  function sidebar() {
    var p = PMO.program || {};
    var html = '<aside class="sidebar" id="sidebar">' +
      '<div class="sb-brand">' +
        '<div class="sb-mark">HB</div>' +
        '<div style="min-width:0">' +
          '<div class="sb-brand-name">' + esc(p.businessName || 'Howrah Bridge') + '</div>' +
          '<div class="sb-brand-sub">' + esc(p.projectName || 'Digital Marketing Growth Plan') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sb-scroll">';

    NAV.forEach(function (g) {
      html += '<div class="sb-group"><div class="sb-group-label">' + esc(g.group) + '</div>';
      g.items.forEach(function (it) {
        html += '<a class="sb-link" href="#/' + it.route + '" data-route="' + it.route + '">' +
          '<span class="sb-ico">' + it.icon + '</span>' +
          '<span class="sb-link-text">' + esc(it.label) + '</span></a>';
      });
      html += '</div>';
    });

    html += '<div class="sb-group"><div class="sb-group-label">Delivery Phases</div>';
    PMO.phases.forEach(function (ph) {
      html += '<a class="sb-link" href="#/phase/' + esc(ph.id) + '" data-route="phase:' + esc(ph.id) + '">' +
        '<span class="sb-num">' + ph.number + '</span>' +
        '<span class="sb-link-text">' + esc(ph.name) + '</span>' +
        '<span class="sb-dot ' + esc(ph.health || 'green') + '" title="' +
          UI.attr(ph.progress + '% complete') + '"></span></a>';
    });
    html += '</div></div>';

    html += '<div class="sb-foot">' +
      'Reporting as of ' + esc(PMO.fmtDate(p.asOf)) + '<br/>' +
      PMO.totals.modules + ' modules · ' + PMO.totals.tasks + ' tasks · ' +
      PMO.totals.progress + '% complete' +
    '</div></aside>';
    return html;
  }

  function topbar() {
    var p = PMO.program || {};
    return '<header class="topbar">' +
      '<button class="tb-burger" id="burger" aria-label="Toggle navigation">☰</button>' +
      '<div>' +
        '<div class="tb-crumb" id="tb-crumb"></div>' +
        '<div class="tb-title" id="tb-title"></div>' +
      '</div>' +
      '<div class="tb-spacer"></div>' +
      '<div class="tb-meta">' +
        '<div class="tb-kv"><span class="tb-kv-l">Programme</span>' +
          '<span class="tb-kv-v">Month ' + UI.currentMonthN() + ' of 12</span></div>' +
        '<div class="tb-kv"><span class="tb-kv-l">Completion</span>' +
          '<span class="tb-kv-v">' + PMO.totals.progress + '%</span></div>' +
        '<div class="tb-kv"><span class="tb-kv-l">As Of</span>' +
          '<span class="tb-kv-v">' + esc(PMO.fmtDate(p.asOf)) + '</span></div>' +
        UI.healthPill(PMO.health.state) +
        '<button class="phase-open-link" id="print-btn" title="Print or export this page as PDF">' +
          'Print</button>' +
      '</div>' +
    '</header>';
  }

  /* ---------- module drill-down ------------------------------------------- */

  function moduleModal(id) {
    var m = PMO.moduleById[id];
    if (!m) return;
    var ph = PMO.phaseById[m.phaseId];

    var tasks = (m.tasks || []).map(function (t) {
      var s = PMO.statusMeta(t.status);
      return '<div class="task-row ' + (t.status === 'completed' ? 'done' : '') + '">' +
        '<span class="dot ' + s.dot + '"></span>' +
        '<span class="tname">' + esc(t.name) + '</span>' +
        (t.overdue ? '<span class="pill block">overdue</span>' : '') +
        '<span class="tdue">' + esc(PMO.fmtDate(t.due)) + '</span>' +
        '<span class="towner">' + esc(t.owner || '—') + '</span>' +
      '</div>';
    }).join('');

    var delivs = (m.deliverables || []).map(function (d) {
      return '<div class="task-row">' +
        '<span class="tname"><strong>' + esc(d.name) + '</strong>' +
          '<div class="muted" style="font-size:10.5px;color:var(--ink-4);margin-top:2px">Depends on: ' +
          esc(d.dependency || '—') + '</div></span>' +
        UI.delivStatusPill(d.status) +
        '<span class="tdue">' + esc(PMO.fmtDate(d.due)) + '</span>' +
        '<span class="towner">' + esc(d.owner || '—') + '</span>' +
      '</div>';
    }).join('');

    var metrics = Object.keys(m.metrics || {}).map(function (k) {
      var col = ((ph && ph.extraColumns) || []).filter(function (c) { return c.key === k; })[0];
      return '<div><span class="l">' + esc(col ? col.label : k) + '</span>' +
        '<span class="v">' + esc(m.metrics[k]) + '</span></div>';
    }).join('');

    var html = '<div class="modal-back" id="modal-back"><div class="modal">' +
      '<div class="modal-h">' +
        '<div style="flex:1">' +
          '<div class="tb-crumb">Phase ' + (ph ? ph.number : '') + ' · ' +
            esc(ph ? ph.name : '') + '</div>' +
          '<h3>' + esc(m.name) + '</h3>' +
          '<div class="sub">' + esc(m.summary || '') + '</div>' +
        '</div>' +
        '<button class="modal-x" id="modal-x" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="modal-b">' +
        '<div class="psum" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">' +
          '<div><div class="l">Status</div><div style="margin-top:4px">' +
            UI.statusPill(m.status) + '</div>' +
            '<div class="s">' + UI.priority(m.priority) + ' priority</div></div>' +
          '<div><div class="l">Progress</div>' + UI.progressBar(m) +
            '<div class="s">' + m.counts.completed + ' of ' + m.counts.total + ' tasks' +
            (m.counts.overdue ? ' · ' + m.counts.overdue + ' overdue' : '') + '</div></div>' +
          '<div><div class="l">Window</div><div class="v sm">' +
            esc(m.windowLabel || 'Unscheduled') + '</div>' +
            '<div class="s">' + (m.durationDays ? m.durationDays + ' days' : '—') + '</div></div>' +
        '</div>' +

        '<div class="grid g2" style="margin-bottom:16px">' +
          '<div><div class="kpi-l" style="margin-bottom:5px">Owners</div>' +
            UI.ownersCell(m.owners) + '</div>' +
          '<div><div class="kpi-l" style="margin-bottom:5px">Dependencies</div>' +
            UI.depsCell(m.dependencies) + '</div>' +
        '</div>' +

        (m.expectedOutcome
          ? '<div class="note" style="margin-bottom:16px"><b>Expected outcome:</b> ' +
            esc(m.expectedOutcome) + '</div>' : '') +

        (metrics ? '<div class="w-foot" style="border-top:none;padding-top:0;margin-bottom:16px;' +
          'gap:26px;justify-content:flex-start">' + metrics + '</div>' : '') +

        UI.sectionTitle('Tasks', m.counts.total) +
        '<div class="task-list">' + (tasks || '<div class="empty-state">No tasks.</div>') + '</div>' +

        UI.sectionTitle('Deliverables', (m.deliverables || []).length) +
        '<div class="task-list">' + (delivs || '<div class="empty-state">No deliverables.</div>') + '</div>' +
      '</div>' +
    '</div></div>';

    var host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host.firstChild);

    function close() {
      var b = document.getElementById('modal-back');
      if (b) b.parentNode.removeChild(b);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.getElementById('modal-x').addEventListener('click', close);
    document.getElementById('modal-back').addEventListener('click', function (e) {
      if (e.target.id === 'modal-back') close();
    });
    document.addEventListener('keydown', onKey);
  }

  /* ---------- router ------------------------------------------------------- */

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { route: 'home', arg: null };
    if (parts[0] === 'phase') return { route: 'phase', arg: parts[1] || 'p1' };
    return { route: parts[0], arg: parts[1] || null };
  }

  function viewFor(route) {
    return (PMO.views || {})[route] || PMO.views.home;
  }

  function render(after) {
    var view = viewFor(current.route);
    var root = document.getElementById('view');
    root.innerHTML = '<div class="page">' +
      (current.route === 'phase' ? view.render(current.arg) : view.render()) + '</div>';

    var title = current.route === 'phase' && view.titleFor
      ? view.titleFor(current.arg) : (view.title || 'Dashboard');
    var crumb = current.route === 'phase'
      ? ((PMO.program || {}).projectName || '') + ' · Delivery Phase'
      : (view.crumb || '');
    document.getElementById('tb-title').textContent = title;
    document.getElementById('tb-crumb').textContent = crumb;
    document.title = title + ' — ' + ((PMO.program || {}).businessName || 'PMO Dashboard');

    highlightNav();
    wireInteractions(root);
    if (view.mount) view.mount(root);
    if (after) after(root);
  }

  PMO.rerender = render;

  function highlightNav() {
    var key = current.route === 'phase' ? 'phase:' + current.arg : current.route;
    document.querySelectorAll('.sb-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === key);
    });
  }

  function wireInteractions(root) {
    root.querySelectorAll('[data-toggle]').forEach(function (bar) {
      bar.addEventListener('click', function (e) {
        if (e.target.closest('.phase-open-link')) return;
        bar.parentNode.classList.toggle('collapsed');
      });
    });
    root.querySelectorAll('[data-module]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        moduleModal(el.getAttribute('data-module'));
      });
    });
  }

  function onRoute() {
    current = parseHash();
    render();
    window.scrollTo(0, 0);
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('open');
  }

  /* ---------- boot --------------------------------------------------------- */

  function boot() {
    PMO.build();

    if (!PMO.program) {
      document.body.innerHTML = '<div class="empty-state" style="padding:80px">' +
        'Programme data failed to load.</div>';
      return;
    }

    document.body.innerHTML = '<div class="app">' + sidebar() +
      '<div class="main">' + topbar() + '<div id="view"></div></div></div>';

    var printBtn = document.getElementById('print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        // Expand every collapsed phase block so nothing is silently omitted from the export.
        document.querySelectorAll('.phase-block.collapsed').forEach(function (b) {
          b.classList.remove('collapsed');
        });
        window.print();
      });
    }

    var burger = document.getElementById('burger');
    if (burger) {
      burger.addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('open');
      });
    }

    window.addEventListener('hashchange', onRoute);
    onRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.PMO);
