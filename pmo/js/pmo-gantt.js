/* ==========================================================================
   PMO GANTT — shared Gantt renderer (month grid + bars + milestones + now line)
   Used by the master Gantt page and by each phase page.
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc, attr = UI.attr;

  function monthHeader() {
    var months = PMO.months();
    var nowN = UI.currentMonthN();
    return '<div class="gantt-head">' +
      '<div class="gantt-label-col">Workstream / Module</div>' +
      '<div class="gantt-months">' + months.map(function (m) {
        return '<div class="gm' + (m.n === nowN ? ' is-now' : '') + '">' +
          '<div class="gm-n">M' + m.n + '</div>' +
          '<div class="gm-d">' + esc(m.short) + ' ' + String(m.year).slice(2) + '</div></div>';
      }).join('') + '</div></div>';
  }

  function grid() {
    var months = PMO.months();
    var nowN = UI.currentMonthN();
    return '<div class="gl-grid">' + months.map(function (m) {
      return '<i class="' + (m.n === nowN ? 'is-now' : '') + '"></i>';
    }).join('') + '</div>';
  }

  function nowLine() {
    return '<div class="gantt-now" style="left:' + PMO.elapsedPct.toFixed(2) + '%"></div>';
  }

  function barFor(m, opts) {
    if (!m.scheduled) {
      return '<div class="gl-track">' + grid() + nowLine() +
        '<div style="position:absolute;left:6px;top:11px"><span class="pill idle">Unscheduled</span></div></div>';
    }
    var tone = m.status === 'completed' ? 'ok'
      : (m.status === 'in-progress' ? 'prog'
        : (m.status === 'blocked' ? 'block' : 'idle'));
    var tip = m.name + '  ·  ' + m.windowLabel + '  ·  ' + m.progress + '% (' +
      m.counts.completed + '/' + m.counts.total + ' tasks)' +
      (m.owners && m.owners.length ? '  ·  ' + m.owners.join(', ') : '');
    var label = (opts && opts.barLabel === false) ? '' :
      '<span>' + esc(m.progress + '% · ' + UI.truncate(m.name, 34)) + '</span>';
    var fill = (m.status === 'in-progress' && m.progressCompleted > 0)
      ? '<i class="gfill" style="width:' + m.progressCompleted.toFixed(1) + '%"></i>' : '';
    return '<div class="gl-track">' + grid() + nowLine() +
      '<div class="gbar ' + tone + ' tooltip-host" data-tip="' + attr(tip) + '" style="left:' +
        m.barLeft.toFixed(2) + '%;width:' + m.barWidth.toFixed(2) + '%">' + fill + label + '</div>' +
    '</div>';
  }

  /**
   * groups: [{ label, color, phaseId, number, progress, modules:[module] }]
   */
  function render(groups, opts) {
    opts = opts || {};
    var html = '<div class="gantt"><div class="gantt-inner">' + monthHeader();

    groups.forEach(function (g) {
      if (opts.groupHeaders !== false) {
        var span = groupSpan(g.modules);
        html += '<div class="gantt-lane lane-head">' +
          '<div class="gl-label">' +
            '<span class="swatch" style="background:' + (g.color || 'var(--accent)') + '"></span>' +
            (g.number ? '<span class="pnum">P' + g.number + '</span>' : '') +
            '<span class="t">' + esc(g.label) + '</span>' +
          '</div>' +
          '<div class="gl-track">' + grid() + nowLine() +
            (span ? '<div class="gbar ' + span.tone + ' tooltip-host" data-tip="' +
              attr(g.label + ' · ' + span.window + ' · ' + g.progress + '% complete') +
              '" style="left:' + span.left.toFixed(2) + '%;width:' + span.width.toFixed(2) +
              '%;opacity:.92"><i class="gfill" style="width:' + (g.progress || 0) +
              '%"></i><span>' + esc(g.label + ' — ' + (g.progress || 0) + '%') + '</span></div>' : '') +
          '</div>' +
        '</div>';
      }
      (g.modules || []).forEach(function (m) {
        html += '<div class="gantt-lane">' +
          '<div class="gl-label" style="padding-left:' + (opts.groupHeaders === false ? 14 : 30) + 'px">' +
            '<span class="t m-link" data-module="' + esc(m.id) + '">' + esc(m.name) + '</span>' +
          '</div>' +
          barFor(m, opts) +
        '</div>';
      });
    });

    if (opts.milestones && opts.milestones.length) {
      html += '<div class="gantt-lane lane-head">' +
        '<div class="gl-label"><span class="swatch" style="background:var(--accent)"></span>' +
          '<span class="t">Programme Milestones</span></div>' +
        '<div class="gl-track" style="min-height:42px">' + grid() + nowLine() +
          opts.milestones.map(function (ms) {
            var pos = PMO.posOf(ms.date);
            if (pos === null) return '';
            var cls = ms.status === 'completed' ? 'done'
              : (ms.status === 'at-risk' || ms.status === 'blocked' ? 'risk' : '');
            return '<div class="gmile ' + cls + ' tooltip-host" style="left:' + pos.toFixed(2) +
              '%" data-tip="' + attr(PMO.fmtDate(ms.date) + ' — ' + ms.name) + '"></div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    html += '</div>' + legend() + '</div>';
    return html;
  }

  function groupSpan(modules) {
    var scheduled = (modules || []).filter(function (m) { return m.scheduled; });
    if (!scheduled.length) return null;
    var left = Math.min.apply(null, scheduled.map(function (m) { return m.barLeft; }));
    var right = Math.max.apply(null, scheduled.map(function (m) { return m.barLeft + m.barWidth; }));
    var starts = scheduled.map(function (m) { return m.start; }).sort();
    var ends = scheduled.map(function (m) { return m.end; }).sort();
    var anyProg = scheduled.some(function (m) { return m.status === 'in-progress'; });
    var anyBlock = scheduled.some(function (m) { return m.status === 'blocked'; });
    var allDone = scheduled.every(function (m) { return m.status === 'completed'; });
    return {
      left: left,
      width: Math.max(1.2, right - left),
      tone: allDone ? 'ok' : (anyBlock ? 'block' : (anyProg ? 'prog' : 'idle')),
      window: PMO.fmtWindow(starts[0], ends[ends.length - 1])
    };
  }

  function legend() {
    var items = [
      ['var(--ok)', 'Completed'],
      ['var(--prog)', 'In progress'],
      ['#aeb4bd', 'Not started'],
      ['var(--block)', 'Blocked']
    ];
    return '<div class="gantt-legend">' +
      items.map(function (i) {
        return '<span class="gl-item"><span class="gl-swatch" style="background:' + i[0] + '"></span>' +
          i[1] + '</span>';
      }).join('') +
      '<span class="gl-item"><span class="gmile" style="position:relative;left:0;top:0;transform:rotate(45deg)"></span>' +
        '&nbsp;&nbsp;Milestone</span>' +
      '<span class="gl-item"><span style="display:inline-block;width:2px;height:12px;background:var(--accent)"></span>' +
        ' Today (' + PMO.fmtDate(PMO.program.asOf) + ')</span>' +
      '<span class="gl-item" style="margin-left:auto">Shaded overlay on a bar = share of tasks complete</span>' +
    '</div>';
  }

  PMO.Gantt = { render: render, monthHeader: monthHeader, grid: grid, nowLine: nowLine };
})(window.PMO);
