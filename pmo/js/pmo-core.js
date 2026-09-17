/* ==========================================================================
   PMO CORE — registry, rollup engine, date maths, formatters
   Loaded before every data file. Data files only call PMO.register*().
   ========================================================================== */
(function (global) {
  'use strict';

  var PMO = {
    program: null,
    phases: [],
    phaseById: {},
    moduleById: {},
    intel: null,
    library: null,
    totals: null,
    built: false
  };

  /* ---------- registration ------------------------------------------------ */

  PMO.registerProgram = function (p) { PMO.program = p; };
  PMO.registerPhase = function (p) { PMO.phases.push(p); };
  PMO.registerIntel = function (i) { PMO.intel = i; };
  PMO.registerLibrary = function (l) { PMO.library = l; };

  /* ---------- dates ------------------------------------------------------- */

  var MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseISO(s) {
    if (!s || typeof s !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  PMO.parseISO = parseISO;

  var DAY = 86400000;

  function fmtDate(s) {
    var t = parseISO(s);
    if (t === null) return '—';
    var d = new Date(t);
    return d.getUTCDate() + ' ' + MONTH_ABBR[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  PMO.fmtDate = fmtDate;

  function fmtWindow(start, end) {
    if (!start && !end) return null;
    return fmtDate(start) + ' → ' + fmtDate(end);
  }
  PMO.fmtWindow = fmtWindow;

  function daysBetween(a, b) {
    var x = parseISO(a), y = parseISO(b);
    if (x === null || y === null) return null;
    return Math.round((y - x) / DAY);
  }
  PMO.daysBetween = daysBetween;

  /* ---------- numbers ----------------------------------------------------- */

  function inr(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var neg = n < 0;
    var s = String(Math.round(Math.abs(n)));
    var last3 = s.slice(-3);
    var rest = s.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '-' : '') + '₹' + rest + last3;
  }
  PMO.inr = inr;

  function inrShort(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2) + 'L';
    if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
    return inr(n);
  }
  PMO.inrShort = inrShort;

  function num(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  PMO.num = num;

  function pct(n) { return Math.round(n || 0) + '%'; }
  PMO.pct = pct;

  /* ---------- status vocabulary ------------------------------------------- */

  var STATUS_META = {
    'completed':   { label: 'Completed',   cls: 'ok',    dot: 'ok' },
    'in-progress': { label: 'In Progress', cls: 'prog',  dot: 'prog' },
    'not-started': { label: 'Not Started', cls: 'idle',  dot: 'idle' },
    'blocked':     { label: 'Blocked',     cls: 'block', dot: 'block' },
    'at-risk':     { label: 'At Risk',     cls: 'warn',  dot: 'warn' }
  };
  PMO.statusMeta = function (s) {
    return STATUS_META[s] || { label: s || 'Unknown', cls: 'idle', dot: 'idle' };
  };

  function normStatus(s) {
    if (!s) return 'not-started';
    var k = String(s).toLowerCase().replace(/\s+/g, '-');
    if (k === 'inprogress' || k === 'in_progress' || k === 'active') k = 'in-progress';
    if (k === 'complete' || k === 'done') k = 'completed';
    if (k === 'notstarted' || k === 'pending' || k === 'planned') k = 'not-started';
    return STATUS_META[k] ? k : 'not-started';
  }
  PMO.normStatus = normStatus;

  /* ---------- rollup engine ----------------------------------------------- */

  function emptyCounts() {
    return { completed: 0, inProgress: 0, notStarted: 0, blocked: 0, total: 0, overdue: 0 };
  }

  function addCounts(a, b) {
    a.completed += b.completed; a.inProgress += b.inProgress;
    a.notStarted += b.notStarted; a.blocked += b.blocked;
    a.total += b.total; a.overdue += b.overdue;
    return a;
  }

  function countTask(c, status, overdue) {
    c.total++;
    if (status === 'completed') c.completed++;
    else if (status === 'in-progress') c.inProgress++;
    else if (status === 'blocked') c.blocked++;
    else c.notStarted++;
    if (overdue) c.overdue++;
  }

  /**
   * Build all derived state. Idempotent — safe to call once after data load.
   */
  PMO.build = function () {
    if (PMO.built) return PMO;

    var prog = PMO.program || {};
    var asOf = parseISO(prog.asOf) || Date.UTC(2026, 8, 17);
    var pStart = parseISO(prog.programStart) || Date.UTC(2025, 9, 1);
    var pEnd = parseISO(prog.programEnd) || Date.UTC(2026, 8, 30);
    var span = Math.max(1, pEnd - pStart);

    PMO.asOf = asOf;
    PMO.programStart = pStart;
    PMO.programEnd = pEnd;
    PMO.programSpan = span;
    PMO.elapsedPct = Math.min(100, Math.max(0, ((asOf - pStart) / span) * 100));

    PMO.phases.sort(function (a, b) { return (a.number || 0) - (b.number || 0); });

    var grand = emptyCounts();
    var moduleTotal = 0;
    var allRisks = [];
    var allDeliverables = [];
    var allTasks = [];

    PMO.phases.forEach(function (ph) {
      PMO.phaseById[ph.id] = ph;
      var pc = emptyCounts();
      var pStartT = null, pEndT = null;
      var modStatusCount = { completed: 0, 'in-progress': 0, 'not-started': 0, blocked: 0 };

      (ph.modules || []).forEach(function (m) {
        m.phaseId = ph.id;
        m.phaseNumber = ph.number;
        m.phaseName = ph.name;
        PMO.moduleById[m.id] = m;
        moduleTotal++;

        var mc = emptyCounts();
        (m.tasks || []).forEach(function (t) {
          t.status = normStatus(t.status);
          t.moduleId = m.id;
          t.moduleName = m.name;
          t.phaseId = ph.id;
          var due = parseISO(t.due);
          t.overdue = !!(due !== null && due < asOf && t.status !== 'completed');
          countTask(mc, t.status, t.overdue);
          allTasks.push(t);
        });

        m.counts = mc;
        m.progress = mc.total ? Math.round((mc.completed / mc.total) * 100) : 0;
        m.progressInProgress = mc.total ? (mc.inProgress / mc.total) * 100 : 0;
        m.progressCompleted = mc.total ? (mc.completed / mc.total) * 100 : 0;
        m.status = normStatus(m.status);
        m.scheduled = !!(m.start && m.end);
        m.windowLabel = m.scheduled ? fmtWindow(m.start, m.end) : null;
        m.durationDays = m.scheduled ? daysBetween(m.start, m.end) : null;

        if (m.scheduled) {
          var s = parseISO(m.start), e = parseISO(m.end);
          m.barLeft = Math.max(0, ((s - pStart) / span) * 100);
          m.barWidth = Math.max(1.1, Math.min(100 - m.barLeft, ((e - s) / span) * 100));
          if (pStartT === null || s < pStartT) pStartT = s;
          if (pEndT === null || e > pEndT) pEndT = e;
        } else {
          m.barLeft = null;
          m.barWidth = null;
        }

        (m.deliverables || []).forEach(function (d) {
          d.moduleId = m.id;
          d.moduleName = m.name;
          d.phaseId = ph.id;
          d.phaseNumber = ph.number;
          d.phaseName = ph.name;
          var dd = parseISO(d.due);
          d.overdue = !!(dd !== null && dd < asOf &&
                         d.status !== 'Delivered' && d.status !== 'Closed');
          allDeliverables.push(d);
        });

        modStatusCount[m.status] = (modStatusCount[m.status] || 0) + 1;
        addCounts(pc, mc);
      });

      (ph.risks || []).forEach(function (r) {
        r.phaseId = ph.id;
        r.phaseNumber = ph.number;
        r.phaseName = ph.name;
        r.score = riskScore(r);
        allRisks.push(r);
      });

      ph.counts = pc;
      ph.moduleCount = (ph.modules || []).length;
      ph.moduleStatusCount = modStatusCount;
      ph.progress = pc.total ? Math.round((pc.completed / pc.total) * 100) : 0;
      ph.progressInProgress = pc.total ? (pc.inProgress / pc.total) * 100 : 0;
      ph.progressCompleted = pc.total ? (pc.completed / pc.total) * 100 : 0;
      ph.startDate = pStartT !== null ? isoOf(pStartT) : null;
      ph.endDate = pEndT !== null ? isoOf(pEndT) : null;
      ph.windowLabel = ph.startDate ? fmtWindow(ph.startDate, ph.endDate) : null;
      ph.barLeft = pStartT !== null ? Math.max(0, ((pStartT - pStart) / span) * 100) : null;
      ph.barWidth = pStartT !== null
        ? Math.max(1.1, Math.min(100 - ph.barLeft, ((pEndT - pStartT) / span) * 100)) : null;
      ph.status = ph.progress >= 100 ? 'completed'
        : (pc.blocked > 0 ? 'blocked'
          : (pc.completed > 0 || pc.inProgress > 0 ? 'in-progress' : 'not-started'));
      ph.owners = uniqueOwners(ph);

      addCounts(grand, pc);
    });

    PMO.totals = {
      phases: PMO.phases.length,
      modules: moduleTotal,
      tasks: grand.total,
      completed: grand.completed,
      inProgress: grand.inProgress,
      pending: grand.notStarted,
      blocked: grand.blocked,
      overdue: grand.overdue,
      progress: grand.total ? Math.round((grand.completed / grand.total) * 100) : 0,
      progressInProgress: grand.total ? (grand.inProgress / grand.total) * 100 : 0,
      deliverables: allDeliverables.length,
      deliverablesDelivered: allDeliverables.filter(function (d) {
        return d.status === 'Delivered';
      }).length,
      risks: allRisks.length,
      risksOpen: allRisks.filter(function (r) {
        return r.status !== 'Closed';
      }).length
    };

    PMO.allRisks = allRisks.sort(function (a, b) { return b.score - a.score; });
    PMO.allDeliverables = allDeliverables;
    PMO.allTasks = allTasks;
    PMO.health = programHealth();
    PMO.built = true;
    return PMO;
  };

  function isoOf(t) {
    var d = new Date(t);
    var mm = String(d.getUTCMonth() + 1);
    var dd = String(d.getUTCDate());
    return d.getUTCFullYear() + '-' + (mm.length < 2 ? '0' + mm : mm) +
      '-' + (dd.length < 2 ? '0' + dd : dd);
  }
  PMO.isoOf = isoOf;

  function uniqueOwners(ph) {
    var seen = {}, out = [];
    (ph.modules || []).forEach(function (m) {
      (m.owners || []).forEach(function (o) {
        if (!seen[o]) { seen[o] = 1; out.push(o); }
      });
    });
    return out;
  }

  var IMPACT_W = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  var PROB_W = { High: 3, Medium: 2, Low: 1 };

  function riskScore(r) {
    var i = IMPACT_W[r.impact] || 1;
    var p = PROB_W[r.probability] || 1;
    var s = i * p;
    if (r.status === 'Closed') s = 0;
    return s;
  }
  PMO.riskScore = riskScore;

  PMO.riskLevel = function (score) {
    if (score >= 9) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  /* ---------- health ------------------------------------------------------ */

  function programHealth() {
    var t = PMO.totals;
    var reds = PMO.phases.filter(function (p) { return p.health === 'red'; }).length;
    var ambers = PMO.phases.filter(function (p) { return p.health === 'amber'; }).length;
    var schedulePressure = PMO.elapsedPct - t.progress;

    // Blocked work is judged as a share of total scope, not an absolute count —
    // a handful of blocked tasks in a 400-task programme is not a red programme.
    var blockedShare = t.tasks ? (t.blocked / t.tasks) * 100 : 0;

    var state, label, note;
    if (reds > 0 || blockedShare > 4 || schedulePressure > 30) {
      state = 'red';
      label = 'Critical';
      note = 'Delivery is materially behind plan and requires steering-committee intervention.';
    } else if (ambers >= 3 || t.blocked > 0 || schedulePressure > 15) {
      state = 'amber';
      label = 'Needs Attention';
      note = ambers + ' of ' + PMO.phases.length + ' phases are amber and ' + t.blocked +
        ' task' + (t.blocked === 1 ? ' is' : 's are') + ' blocked on external dependencies.';
    } else {
      state = 'green';
      label = 'On Track';
      note = 'All workstreams are tracking to the 12-month plan.';
    }
    return {
      state: state,
      label: label,
      note: note,
      reds: reds,
      ambers: ambers,
      greens: PMO.phases.length - reds - ambers,
      schedulePressure: schedulePressure
    };
  }

  /* ---------- lookup helpers --------------------------------------------- */

  PMO.moduleName = function (id) {
    var m = PMO.moduleById[id];
    if (!m) return id;
    return 'P' + m.phaseNumber + ' · ' + m.name;
  };

  PMO.teamMember = function (name) {
    var team = (PMO.program && PMO.program.team) || [];
    for (var i = 0; i < team.length; i++) if (team[i].name === name) return team[i];
    return null;
  };

  PMO.initialsFor = function (name) {
    var tm = PMO.teamMember(name);
    if (tm && tm.initials) return tm.initials;
    return String(name || '?').split(/\s+/).map(function (w) { return w.charAt(0); })
      .join('').slice(0, 2).toUpperCase();
  };

  PMO.roleFor = function (name) {
    var tm = PMO.teamMember(name);
    return tm ? tm.role : '';
  };

  PMO.months = function () {
    if (PMO.program && PMO.program.months && PMO.program.months.length) return PMO.program.months;
    var out = [];
    for (var i = 0; i < 12; i++) {
      var d = new Date(PMO.programStart);
      d.setUTCMonth(d.getUTCMonth() + i);
      out.push({
        n: i + 1, label: 'Month ' + (i + 1),
        short: MONTH_ABBR[d.getUTCMonth()], year: d.getUTCFullYear()
      });
    }
    return out;
  };

  /** Percent offset of a date within the programme window. */
  PMO.posOf = function (iso) {
    var t = parseISO(iso);
    if (t === null) return null;
    return Math.max(0, Math.min(100, ((t - PMO.programStart) / PMO.programSpan) * 100));
  };

  global.PMO = PMO;
})(window);
