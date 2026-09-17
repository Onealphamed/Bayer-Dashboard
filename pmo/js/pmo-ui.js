/* ==========================================================================
   PMO UI — shared component builders (pure string -> HTML)
   ========================================================================== */
(function (PMO) {
  'use strict';

  var UI = {};

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  UI.esc = esc;

  function attr(s) { return esc(s).replace(/\n/g, ' '); }
  UI.attr = attr;

  /* ---------- small atoms -------------------------------------------------- */

  UI.statusPill = function (status) {
    var m = PMO.statusMeta(status);
    return '<span class="pill ' + m.cls + '"><span class="dot ' + m.dot + '"></span>' +
      esc(m.label) + '</span>';
  };

  UI.healthPill = function (health) {
    var map = {
      green: { cls: 'ok', label: 'On Track' },
      amber: { cls: 'warn', label: 'Needs Attention' },
      red: { cls: 'block', label: 'Critical' }
    };
    var h = map[health] || map.green;
    return '<span class="pill ' + h.cls + '"><span class="dot ' + h.cls + '"></span>' + h.label + '</span>';
  };

  UI.priority = function (p) {
    return '<span class="prio ' + esc(p || 'Low') + '">' + esc(p || '—') + '</span>';
  };

  UI.delivStatusPill = function (s) {
    var map = {
      'Delivered': 'ok', 'Closed': 'ok',
      'In Review': 'prog', 'In Progress': 'prog',
      'Pending': 'idle', 'Planned': 'idle',
      'Blocked': 'block', 'At Risk': 'warn'
    };
    return '<span class="pill ' + (map[s] || 'idle') + '">' + esc(s || '—') + '</span>';
  };

  UI.riskStatusPill = function (s) {
    var map = { 'Open': 'block', 'Mitigating': 'warn', 'Monitoring': 'prog', 'Closed': 'ok' };
    return '<span class="pill ' + (map[s] || 'idle') + '">' + esc(s || '—') + '</span>';
  };

  /* ---------- progress ----------------------------------------------------- */

  /**
   * Reference behaviour: the numeric label is completed/total; the bar draws the
   * completed share in green then the in-flight share in blue.
   */
  UI.progressBar = function (o, cls) {
    var done = o.progressCompleted !== undefined ? o.progressCompleted
      : (o.counts && o.counts.total ? (o.counts.completed / o.counts.total) * 100 : 0);
    var prog = o.progressInProgress !== undefined ? o.progressInProgress
      : (o.counts && o.counts.total ? (o.counts.inProgress / o.counts.total) * 100 : 0);
    var label = o.progress !== undefined ? o.progress : Math.round(done);
    var full = done >= 99.5;
    return '<div class="pbar ' + (cls || '') + '">' +
      '<div class="pbar-track">' +
        '<i class="pbar-fill' + (full ? ' full' : '') + '" style="width:' + done.toFixed(2) + '%"></i>' +
        '<i class="pbar-prog" style="width:' + prog.toFixed(2) + '%"></i>' +
      '</div>' +
      '<span class="pbar-v">' + Math.round(label) + '%</span>' +
    '</div>';
  };

  UI.miniBar = function (pctValue, tone) {
    var v = Math.max(0, Math.min(100, pctValue || 0));
    return '<div class="bar-cell">' +
      '<span class="mini-track"><i class="mini-fill ' + (tone || '') + '" style="width:' + v.toFixed(1) + '%"></i></span>' +
      '<span class="mini-v">' + Math.round(v) + '%</span></div>';
  };

  /* ---------- timeline ----------------------------------------------------- */

  UI.timelineHead = function () {
    var months = PMO.months();
    var nowMonth = currentMonthN();
    return '<div class="tl-head">' + months.map(function (m) {
      return '<span class="' + (m.n === nowMonth ? 'now' : '') + '">' + esc(m.short) + '</span>';
    }).join('') + '</div>';
  };

  function currentMonthN() {
    var months = PMO.months();
    for (var i = 0; i < months.length; i++) {
      var s = PMO.parseISO(months[i].start), e = PMO.parseISO(months[i].end);
      if (s !== null && e !== null && PMO.asOf >= s && PMO.asOf <= e) return months[i].n;
    }
    return Math.min(12, Math.max(1, Math.ceil(PMO.elapsedPct / 100 * 12)));
  }
  UI.currentMonthN = currentMonthN;

  /**
   * Mini Gantt track for one module row.
   * Unscheduled modules render an "Unscheduled" pill, matching the reference.
   */
  UI.timeline = function (m) {
    if (!m.scheduled) return '<span class="pill idle">Unscheduled</span>';
    var months = PMO.months();
    var cells = months.map(function () { return '<i></i>'; }).join('');
    var tone = m.status === 'completed' ? '' :
      (m.status === 'in-progress' ? 'prog' :
        (m.status === 'blocked' ? 'block' : 'idle'));
    var inner = '';
    if (m.status === 'in-progress' && m.progressCompleted > 0) {
      inner = '<i class="tl-done" style="width:' + m.progressCompleted.toFixed(1) + '%"></i>';
    }
    var tip = m.name + ' — ' + (m.windowLabel || '') + ' · ' + m.progress + '%';
    return '<div class="tl tooltip-host" data-tip="' + attr(tip) + '">' +
      '<div class="tl-cells">' + cells + '</div>' +
      '<div class="tl-bar ' + tone + '" style="left:' + m.barLeft.toFixed(2) + '%;width:' +
        m.barWidth.toFixed(2) + '%">' + inner + '</div>' +
      '<div class="tl-now" style="left:' + PMO.elapsedPct.toFixed(2) + '%"></div>' +
    '</div>';
  };

  /* ---------- cells -------------------------------------------------------- */

  UI.windowCell = function (m) {
    if (!m.scheduled) return '<span class="none">—</span>';
    return '<div class="win">' + esc(PMO.fmtDate(m.start)) +
      ' <span class="to">→</span> ' + esc(PMO.fmtDate(m.end)) +
      '<div class="win-days">' + PMO.daysBetween(m.start, m.end) + ' days</div></div>';
  };

  UI.ownersCell = function (owners) {
    if (!owners || !owners.length) return '<span class="none">—</span>';
    return '<div class="owners">' + owners.map(function (o) {
      return '<span class="owner-line tooltip-host" data-tip="' + attr(PMO.roleFor(o) || o) + '">' +
        esc(o) + '</span>';
    }).join('') + '</div>';
  };

  UI.avatars = function (owners) {
    if (!owners || !owners.length) return '<span class="none">—</span>';
    return '<div class="avatars">' + owners.slice(0, 4).map(function (o) {
      return '<span class="av tooltip-host" data-tip="' + attr(o + ' — ' + PMO.roleFor(o)) + '">' +
        esc(PMO.initialsFor(o)) + '</span>';
    }).join('') + '</div>';
  };

  /** Task-status column: dot rows plus the red overdue pill from the reference. */
  UI.taskStatusCell = function (c) {
    var rows = [];
    if (c.completed) rows.push(['ok', c.completed + ' completed']);
    if (c.inProgress) rows.push(['prog', c.inProgress + ' in progress']);
    if (c.blocked) rows.push(['block', c.blocked + ' blocked']);
    if (c.notStarted) rows.push(['idle', c.notStarted + ' not started']);
    if (!rows.length) rows.push(['idle', 'no tasks']);

    var html = '<div class="tstat">';
    rows.forEach(function (r, i) {
      html += '<div class="tstat-row"><span class="dot ' + r[0] + '"></span>' +
        '<span><b>' + esc(r[1].split(' ')[0]) + '</b> ' +
        esc(r[1].split(' ').slice(1).join(' ')) + '</span>';
      if (i === rows.length - 1 && c.overdue) {
        html += '<span class="pill block">' + c.overdue + ' overdue</span>';
      }
      html += '</div>';
    });
    return html + '</div>';
  };

  UI.depsCell = function (deps) {
    if (!deps || !deps.length) return '<span class="none">—</span>';
    return '<div class="deps">' + deps.map(function (d) {
      var m = PMO.moduleById[d];
      var label = m ? ('P' + m.phaseNumber + ' · ' + m.name) : d;
      return '<span class="dep tooltip-host" data-tip="' + attr(label) + '">' +
        esc(m ? ('P' + m.phaseNumber + ' ' + truncate(m.name, 22)) : d) + '</span>';
    }).join('') + '</div>';
  };

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  UI.truncate = truncate;

  /* ---------- KPI card ----------------------------------------------------- */

  UI.kpi = function (o) {
    return '<div class="kpi ' + (o.tone ? 'k-' + o.tone : '') + '">' +
      '<div class="kpi-l">' + esc(o.label) + '</div>' +
      '<div class="kpi-v' + (o.small ? ' sm' : '') + '">' + (o.html || esc(o.value)) + '</div>' +
      (o.sub ? '<div class="kpi-s">' + esc(o.sub) + '</div>' : '') +
    '</div>';
  };

  /* ---------- the reference phase block ------------------------------------ */

  /**
   * Renders the collapsible phase card + module table that mirrors the
   * supplied design reference (phase bar, progress, mini-Gantt, window,
   * owners, task-status column with overdue pills).
   */
  UI.phaseBlock = function (ph, opts) {
    opts = opts || {};
    var c = ph.counts;
    var extra = opts.showExtra && ph.extraColumns ? ph.extraColumns : [];
    // Fixed table layout: widths must total 100, so the base columns give ground
    // proportionally as phase-specific extra columns are added.
    var W = extra.length
      ? { mod: 15, prog: 11, time: 18, win: 11, own: 9, stat: 15 }
      : { mod: 20, prog: 15, time: 22, win: 13, own: 11, stat: 19 };
    var extraW = extra.length
      ? (100 - (W.mod + W.prog + W.time + W.win + W.own + W.stat)) / extra.length : 0;
    // With phase-specific columns the table needs real width for the 12-month
    // track and the extra cells; the wrapper scrolls rather than squashing them.
    var tableCls = extra.length ? 'mod-table has-extra' : 'mod-table';
    var tableStyle = extra.length
      ? ' style="min-width:' + (1180 + extra.length * 110) + 'px"' : '';

    var head =
      '<div class="phase-bar" data-toggle="' + esc(ph.id) + '">' +
        '<h3>Phase ' + ph.number + '</h3>' +
        '<span class="pill plain">' + ph.moduleCount + ' module' + (ph.moduleCount === 1 ? '' : 's') + '</span>' +
        '<span class="pname">' + esc(ph.name) + '</span>' +
        '<span class="phase-meta">' + c.total + ' tasks · <b>' + ph.progress +
          '% complete</b> · ' + c.inProgress + ' in progress · ' + c.blocked + ' blocked' +
          (c.overdue ? ' · <b style="color:#b91c1c">' + c.overdue + ' overdue</b>' : '') +
        '</span>' +
        '<span class="spacer"></span>' +
        (opts.linkOut !== false
          ? '<a class="phase-open-link" href="#/phase/' + esc(ph.id) + '">Open phase →</a>' : '') +
        '<span class="phase-chev">▾</span>' +
      '</div>';

    var thead =
      '<thead><tr>' +
        '<th class="col-mod" style="width:' + W.mod + '%">Module</th>' +
        '<th class="col-prog" style="width:' + W.prog + '%">Progress</th>' +
        '<th class="col-time" style="width:' + W.time + '%">Timeline' + UI.timelineHead() + '</th>' +
        '<th class="col-win" style="width:' + W.win + '%">Window</th>' +
        '<th class="col-own" style="width:' + W.own + '%">Owners</th>' +
        extra.map(function (x) {
          return '<th class="col-x" style="width:' + extraW.toFixed(2) + '%">' +
            esc(x.label) + '</th>';
        }).join('') +
        '<th class="col-stat" style="width:' + W.stat + '%">Task Status</th>' +
      '</tr></thead>';

    var rows = (ph.modules || []).map(function (m) {
      var rowCls = m.status === 'in-progress' ? 'is-live'
        : (m.status === 'blocked' ? 'is-blocked' : '');
      var sub = m.counts.total + ' task' + (m.counts.total === 1 ? '' : 's') +
        (m.status === 'completed' ? ' · complete'
          : (m.status === 'blocked' ? ' · blocked'
            : (m.status === 'not-started' ? ' · queued' : '')));
      return '<tr class="' + rowCls + '">' +
        '<td><div class="m-link" data-module="' + esc(m.id) + '">' +
          '<div class="m-name">' + esc(m.name) + '</div>' +
          '<div class="m-sub">' + esc(sub) + '</div></div></td>' +
        '<td>' + UI.progressBar(m) + '</td>' +
        '<td>' + UI.timeline(m) + '</td>' +
        '<td>' + UI.windowCell(m) + '</td>' +
        '<td>' + UI.ownersCell(m.owners) + '</td>' +
        extra.map(function (x) {
          var v = (m.metrics || {})[x.key];
          return '<td><span class="win">' + (v ? esc(v) : '<span class="none">—</span>') + '</span></td>';
        }).join('') +
        '<td>' + UI.taskStatusCell(m.counts) + '</td>' +
      '</tr>';
    }).join('');

    return '<div class="phase-block h-' + esc(ph.health || 'green') + '" id="pb-' + esc(ph.id) + '">' +
      head +
      '<div class="phase-body"><div class="mod-scroll"><table class="' + tableCls + '"' +
        tableStyle + '>' + thead +
        '<tbody>' + rows + '</tbody></table></div></div>' +
    '</div>';
  };

  /* ---------- generic table ------------------------------------------------ */

  /**
   * cols: [{label, key?, cls?, render?(row)}]
   */
  UI.table = function (cols, rows, opts) {
    opts = opts || {};
    if (!rows || !rows.length) {
      return '<div class="empty-state">' + esc(opts.empty || 'Nothing to show.') + '</div>';
    }
    var head = '<thead><tr>' + cols.map(function (c) {
      return '<th' + (c.width ? ' style="width:' + c.width + '"' : '') + '>' + esc(c.label) + '</th>';
    }).join('') + '</tr></thead>';
    var body = '<tbody>' + rows.map(function (r) {
      return '<tr>' + cols.map(function (c) {
        var v = c.render ? c.render(r) : esc(r[c.key] === undefined || r[c.key] === null ? '—' : r[c.key]);
        return '<td class="' + (c.cls || '') + '">' + v + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '<div class="dt-wrap' + (opts.scroll ? ' dt-scroll' : '') + '"><table class="dt">' +
      head + body + '</table></div>';
  };

  UI.card = function (title, sub, bodyHtml, opts) {
    opts = opts || {};
    return '<div class="card' + (opts.cls ? ' ' + opts.cls : '') + '">' +
      '<div class="card-h"><div><h2>' + esc(title) + '</h2>' +
        (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>' +
        '<div class="spacer"></div>' + (opts.right || '') +
      '</div>' +
      '<div class="card-b' + (opts.tight ? ' tight' : '') + '">' + bodyHtml + '</div>' +
    '</div>';
  };

  UI.sectionTitle = function (t, count) {
    return '<div class="section-title"><span>' + esc(t) + '</span>' +
      (count !== undefined ? '<span class="count">' + esc(count) + '</span>' : '') +
      '<span class="rule"></span></div>';
  };

  /* ---------- charts: shared palette, options and plugins ------------------
     Palette slots are the validated dataviz reference values for a light
     surface. Status colours are never reused as series colours.              */

  UI.CHART = {
    s1: '#2a78d6',   /* categorical slot 1 — blue   */
    s2: '#eb6834',   /* categorical slot 2 — orange */
    s3: '#1baf7a',   /* categorical slot 3 — aqua   */
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    muted: '#898781',
    ink: '#52514e'
  };

  /* Selective direct labels at the bar ends (never a number on every point of
     a dense series — these charts are short, named comparisons). */
  UI.valueLabelsPlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: function (chart) {
      var opts = (chart.options.plugins || {}).valueLabels;
      if (!opts || !opts.format) return;
      var ctx = chart.ctx;
      ctx.save();
      ctx.font = '600 10.5px Inter, sans-serif';
      ctx.fillStyle = UI.CHART.ink;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach(function (el, i) {
          var v = ds.data[i];
          if (v === null || v === undefined) return;
          ctx.fillText(opts.format(v), el.x + 6, el.y);
        });
      });
      ctx.restore();
    }
  };

  if (typeof Chart !== 'undefined') Chart.register(UI.valueLabelsPlugin);

  /** Horizontal bar options. One axis only — never a second scale. */
  UI.barOpts = function (fmt) {
    var C = UI.CHART;
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 66 } },
      plugins: {
        legend: { display: false },
        valueLabels: { format: fmt },
        tooltip: {
          backgroundColor: '#0f1729', padding: 9, cornerRadius: 5, displayColors: false,
          titleFont: { size: 11, weight: '600' }, bodyFont: { size: 11 },
          callbacks: { label: function (c) { return fmt(c.parsed.x); } }
        }
      },
      scales: {
        x: {
          grid: { color: C.grid }, border: { display: false },
          ticks: { color: C.muted, font: { size: 10 }, callback: function (v) { return fmt(v); } }
        },
        y: {
          grid: { display: false }, border: { color: C.axis },
          ticks: { color: C.ink, font: { size: 10.5, weight: '500' }, autoSkip: false }
        }
      }
    };
  };

  /** Wrap a long category label into at most `lines` rows (Chart.js accepts arrays). */
  UI.wrapLabel = function (s, n, lines) {
    s = String(s || '');
    if (s.length <= n) return s;
    var words = s.split(' '), out = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; }
      else cur += ' ' + w;
    });
    if (cur.trim()) out.push(cur.trim());
    return out.slice(0, lines || 3);
  };

  /** Destroy-and-redraw helper keyed by canvas id. */
  var _charts = {};
  UI.drawChart = function (id, cfg) {
    var el = document.getElementById(id);
    if (!el) return;
    if (typeof Chart === 'undefined') {
      // Chart.js is served from a CDN; if it cannot be reached, show the
      // underlying numbers rather than an empty box.
      var host = el.parentNode;
      if (host && !host.querySelector('.chart-fallback')) {
        host.innerHTML = '<div class="chart-fallback">Chart library unavailable offline.' +
          '<br/>Open \u201cView as table\u201d below for the underlying figures.</div>';
      }
      var details = host && host.parentNode && host.parentNode.querySelector('details');
      if (details) details.open = true;
      return;
    }
    if (_charts[id]) _charts[id].destroy();
    _charts[id] = new Chart(el.getContext('2d'), cfg);
  };

  /** Chart card with a collapsible table view (the accessibility fallback). */
  UI.chartCard = function (id, title, sub, height, tableHtml) {
    return UI.card(title, sub,
      '<div style="position:relative;height:' + height + 'px"><canvas id="' + esc(id) + '"></canvas></div>' +
      (tableHtml ? '<details style="margin-top:12px"><summary style="font-size:11px;' +
        'color:var(--ink-3);cursor:pointer;font-weight:600">View as table</summary>' +
        '<div style="margin-top:8px">' + tableHtml + '</div></details>' : ''));
  };

  PMO.UI = UI;
})(window.PMO);
