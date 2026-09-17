/* ==========================================================================
   VIEW — Phase detail page (one per phase)
   Summary -> module table -> Gantt -> deliverables -> risks -> KPIs -> appendix
   ========================================================================== */
(function (PMO) {
  'use strict';
  var UI = PMO.UI, esc = UI.esc;

  function hero(ph) {
    return '<div class="phase-hero h-' + esc(ph.health || 'green') + '">' +
      '<div class="ph-top">' +
        '<div style="flex:1;min-width:300px">' +
          '<span class="ph-num">Phase ' + ph.number + ' of ' + PMO.phases.length + '</span>' +
          '<div class="ph-name" style="margin-top:8px">' + esc(ph.name) + '</div>' +
          '<div class="ph-sub">' + esc(ph.subtitle || '') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
          UI.healthPill(ph.health) +
          '<span class="pill ' + (ph.riskLevel === 'High' ? 'block'
            : (ph.riskLevel === 'Medium' ? 'warn' : 'idle')) + '">' +
            esc(ph.riskLevel || 'Low') + ' risk</span>' +
          (ph.sourceSheet ? '<span class="chip">Source: ' + esc(ph.sourceSheet) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="ph-body">' +
        '<div><h4>Phase Objective</h4><p>' + esc(ph.objective || '') + '</p></div>' +
        '<div><h4>Expected Outcome</h4><p>' + esc(ph.expectedOutcome || '') + '</p></div>' +
      '</div>' +
    '</div>';
  }

  function summaryStrip(ph) {
    var c = ph.counts;
    return '<div class="psum">' +
      cell('Modules', ph.moduleCount, (ph.moduleStatusCount.completed || 0) + ' complete · ' +
        (ph.moduleStatusCount['in-progress'] || 0) + ' active') +
      cell('Tasks', c.total, c.completed + ' done · ' + c.inProgress + ' active · ' +
        c.notStarted + ' pending') +
      cell('Completion', ph.progress + '%', c.blocked + ' blocked · ' + c.overdue + ' overdue') +
      '<div><div class="l">Progress</div>' + UI.progressBar(ph, 'wide') +
        '<div class="s">' + Math.round(PMO.elapsedPct) + '% of schedule elapsed</div></div>' +
      cellSm('Risk Level', (ph.riskLevel || 'Low') + ' · ' + (ph.risks || []).length + ' registered',
        (ph.risks || []).filter(function (r) { return r.status !== 'Closed'; }).length + ' open') +
      cellSm('Phase Window', ph.windowLabel || 'Unscheduled',
        ph.startDate ? PMO.daysBetween(ph.startDate, ph.endDate) + ' calendar days' : '—') +
    '</div>';
  }

  function cell(l, v, s) {
    return '<div><div class="l">' + esc(l) + '</div><div class="v">' + esc(v) + '</div>' +
      '<div class="s">' + esc(s) + '</div></div>';
  }
  function cellSm(l, v, s) {
    return '<div><div class="l">' + esc(l) + '</div><div class="v sm">' + esc(v) + '</div>' +
      '<div class="s">' + esc(s) + '</div></div>';
  }

  function moduleTable(ph) {
    return UI.phaseBlock(ph, { showExtra: true, linkOut: false });
  }


  /**
   * Full module register — the reference-styled board above is the visual
   * summary; this carries every governed field the PMO reports on.
   */
  function moduleRegister(ph) {
    var extra = ph.extraColumns || [];
    var cols = [
      { label: 'Module', render: function (m) {
        return '<strong class="m-link" data-module="' + esc(m.id) + '">' + esc(m.name) + '</strong>' +
          '<div class="muted" style="font-size:11px;margin-top:2px">' + esc(m.summary || '') + '</div>';
      } },
      { label: 'Progress', render: function (m) { return UI.progressBar(m); } },
      { label: 'Start Date', cls: 'nowrap', render: function (m) {
        return m.scheduled ? esc(PMO.fmtDate(m.start)) : '<span class="muted">—</span>';
      } },
      { label: 'End Date', cls: 'nowrap', render: function (m) {
        return m.scheduled ? esc(PMO.fmtDate(m.end)) : '<span class="muted">—</span>';
      } },
      { label: 'Timeline', cls: 'nowrap', render: function (m) {
        return m.scheduled
          ? '<span class="chip">M' + monthOf(m.start) + ' \u2192 M' + monthOf(m.end) + '</span>' +
            '<div class="muted" style="font-size:10.5px;margin-top:3px">' + m.durationDays + ' days</div>'
          : '<span class="pill idle">Unscheduled</span>';
      } },
      { label: 'Owner', cls: 'nowrap', render: function (m) { return UI.ownersCell(m.owners); } },
      { label: 'Priority', cls: 'nowrap', render: function (m) { return UI.priority(m.priority); } },
      { label: 'Status', cls: 'nowrap', render: function (m) { return UI.statusPill(m.status); } },
      { label: 'Done', cls: 'num', render: function (m) {
        return '<strong style="color:#1c7a30">' + m.counts.completed + '</strong>';
      } },
      { label: 'Pending', cls: 'num', render: function (m) {
        return m.counts.notStarted + m.counts.inProgress;
      } },
      { label: 'Blocked', cls: 'num', render: function (m) {
        return m.counts.blocked
          ? '<strong style="color:#b91c1c">' + m.counts.blocked + '</strong>' : '0';
      } },
      { label: 'Dependencies', render: function (m) { return UI.depsCell(m.dependencies); } }
    ].concat(extra.map(function (x) {
      return { label: x.label, render: function (m) {
        var v = (m.metrics || {})[x.key];
        return v ? esc(v) : '<span class="muted">—</span>';
      } };
    })).concat([
      { label: 'Expected Outcome', render: function (m) { return esc(m.expectedOutcome || '—'); } }
    ]);

    return UI.card('Module Register',
      'Every governed field per module \u2014 dates, owner, priority, status, task counts, ' +
      'dependencies and expected outcome',
      UI.table(cols, ph.modules || []), { tight: true });
  }

  function monthOf(iso) {
    var months = PMO.months();
    for (var i = 0; i < months.length; i++) {
      if (iso >= months[i].start && iso <= months[i].end) return months[i].n;
    }
    var pos = PMO.posOf(iso);
    return pos === null ? '?' : Math.min(12, Math.max(1, Math.ceil(pos / 100 * 12) || 1));
  }

  function gantt(ph) {
    return UI.card('Phase Gantt — Month 1 to Month 12',
      'Every module plotted across the programme calendar with the live progress overlay',
      PMO.Gantt.render([{
        label: 'Phase ' + ph.number + ' · ' + ph.name,
        number: ph.number,
        color: healthColor(ph.health),
        progress: ph.progress,
        modules: ph.modules || []
      }], {
        milestones: ((PMO.program || {}).milestones || []).filter(function (m) {
          return m.phase === ph.id;
        })
      }),
      { tight: true });
  }

  function healthColor(h) {
    return h === 'red' ? 'var(--block)' : (h === 'amber' ? 'var(--warn)' : 'var(--ok)');
  }

  function deliverables(ph) {
    var rows = [];
    (ph.modules || []).forEach(function (m) {
      (m.deliverables || []).forEach(function (d) { rows.push(d); });
    });
    var body = UI.table([
      { label: 'Deliverable', render: function (d) {
        return '<strong>' + esc(d.name) + '</strong>' +
          '<div class="muted" style="font-size:11px;margin-top:2px">' + esc(d.moduleName) + '</div>';
      } },
      { label: 'Status', cls: 'nowrap', render: function (d) {
        return UI.delivStatusPill(d.status) +
          (d.overdue ? ' <span class="pill block">overdue</span>' : '');
      } },
      { label: 'Due Date', cls: 'nowrap', render: function (d) { return esc(PMO.fmtDate(d.due)); } },
      { label: 'Owner', cls: 'nowrap', render: function (d) { return esc(d.owner || '—'); } },
      { label: 'Dependency', render: function (d) {
        return '<span class="muted">' + esc(d.dependency || '—') + '</span>';
      } },
      { label: 'Priority', cls: 'nowrap', render: function (d) { return UI.priority(d.priority); } }
    ], rows, { empty: 'No deliverables registered for this phase.' });

    var delivered = rows.filter(function (d) { return d.status === 'Delivered'; }).length;
    return UI.card('Deliverables Tracker', rows.length + ' deliverables · ' + delivered +
      ' delivered · ' + rows.filter(function (d) { return d.overdue; }).length + ' overdue',
      body, { tight: true,
        right: UI.miniBar(rows.length ? delivered / rows.length * 100 : 0, 'ok') });
  }

  function risks(ph) {
    var rows = (ph.risks || []).slice().sort(function (a, b) { return b.score - a.score; });
    var body = UI.table([
      { label: 'ID', cls: 'nowrap', render: function (r) {
        var lvl = PMO.riskLevel(r.score);
        return '<span class="pill ' + (lvl === 'critical' || lvl === 'high' ? 'block'
          : (lvl === 'medium' ? 'warn' : 'idle')) + '">' + esc(r.id) + '</span>';
      } },
      { label: 'Risk', render: function (r) { return '<strong>' + esc(r.risk) + '</strong>'; } },
      { label: 'Impact', cls: 'nowrap', render: function (r) { return UI.priority(r.impact); } },
      { label: 'Probability', cls: 'nowrap', render: function (r) { return esc(r.probability); } },
      { label: 'Score', cls: 'num', render: function (r) {
        return '<strong>' + r.score + '</strong>';
      } },
      { label: 'Owner', cls: 'nowrap', render: function (r) { return esc(r.owner); } },
      { label: 'Mitigation Plan', render: function (r) { return esc(r.mitigation); } },
      { label: 'Status', cls: 'nowrap', render: function (r) { return UI.riskStatusPill(r.status); } }
    ], rows, { empty: 'No risks registered for this phase.' });

    return UI.card('Risk Register', rows.length + ' risks · ' +
      rows.filter(function (r) { return r.status !== 'Closed'; }).length + ' open · scored impact × probability',
      body, { tight: true });
  }

  function kpis(ph) {
    if (!ph.kpis || !ph.kpis.length) return '';
    var cards = ph.kpis.map(function (k) {
      var good = k.direction === 'down'
        ? 'Lower is better' : 'Higher is better';
      return '<div class="widget">' +
        '<div class="w-head"><div style="flex:1">' +
          '<div class="w-title">' + esc(k.label) + '</div>' +
          '<div class="w-sub">' + esc(good) + '</div></div></div>' +
        '<div class="w-val">' + esc(k.current !== undefined && k.current !== null ? k.current : k.target) +
          (k.unit ? '<span style="font-size:13px;font-weight:600;color:var(--ink-3)"> ' +
            esc(k.unit) + '</span>' : '') + '</div>' +
        '<div class="w-foot">' +
          '<div><span class="l">Baseline</span><span class="v">' + esc(k.baseline || '—') + '</span></div>' +
          '<div><span class="l">Target</span><span class="v">' + esc(k.target || '—') + '</span></div>' +
        '</div>' +
      '</div>';
    }).join('');
    return UI.sectionTitle('Phase KPIs', ph.kpis.length) + '<div class="grid g4">' + cards + '</div>';
  }

  /* ---------- appendix: verbatim source tables ----------------------------- */

  function appendix(ph) {
    var lib = PMO.library || {};
    var intel = PMO.intel || {};
    var out = '';

    if (ph.id === 'p1' && intel.competitors) {
      out += UI.sectionTitle('Appendix — Competitive Landscape Audit', intel.competitors.length) +
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
            { label: 'SEO Footprint', key: 'seo' },
            { label: 'Local / GBP', key: 'local' },
            { label: 'Social & Paid', key: 'social' },
            { label: 'Vulnerabilities', key: 'vulnerabilities' },
            { label: 'Howrah Bridge Attack Strategy', render: function (r) {
              return '<strong>' + esc(r.attack) + '</strong>';
            } }
          ], intel.competitors), { tight: true });
    }

    if (ph.id === 'p2' && lib.keywords) {
      if (lib.keywordClusters) {
        out += UI.sectionTitle('Appendix — Keyword Architecture', lib.keywords.length + ' keywords');
        out += '<div class="grid g' + Math.min(4, lib.keywordClusters.length) + '" style="margin-bottom:14px">' +
          lib.keywordClusters.map(function (c) {
            return UI.kpi({
              label: c.cluster, value: c.count + ' keywords', small: true, tone: 'accent',
              sub: PMO.num(c.totalVolume) + ' monthly searches · avg KD ' + c.avgKd + '%'
            });
          }).join('') + '</div>';
      }
      out += UI.card('Target Keyword Architecture',
        'Source sheet: Phase 3 — SEO Master Plan · ' + lib.keywords.length + ' tracked keywords',
        UI.table([
          { label: 'Cluster', cls: 'nowrap', key: 'cluster' },
          { label: 'Target Keyword', render: function (k) { return '<strong>' + esc(k.keyword) + '</strong>'; } },
          { label: 'Intent', cls: 'nowrap', key: 'intent' },
          { label: 'KD', cls: 'num', render: function (k) { return k.kd + '%'; } },
          { label: 'Volume / mo', cls: 'num', render: function (k) { return PMO.num(k.volume); } },
          { label: 'Target URL', render: function (k) {
            return '<span class="muted" style="font-family:ui-monospace,Menlo,monospace;font-size:11px">' +
              esc(k.url) + '</span>';
          } },
          { label: 'Priority', cls: 'nowrap', render: function (k) { return UI.priority(k.priority); } },
          { label: 'Current Rank', cls: 'nowrap', render: function (k) {
            if (k.position === null || k.position === undefined) {
              return '<span class="pill idle">tracking</span>';
            }
            var cls = k.position <= 3 ? 'ok' : (k.position <= 10 ? 'prog' : 'idle');
            return '<span class="pill ' + cls + '">#' + k.position + '</span>';
          } }
        ], lib.keywords, { scroll: true }), { tight: true });
    }

    if (ph.id === 'p3' && lib.editorial) {
      out += UI.sectionTitle('Appendix — Editorial Calendar', lib.editorial.length + ' flagship articles') +
        UI.card('12-Month Content Marketing Plan',
          'Source sheet: Phase 5 — Content Calendar · flagship set within the 48-blog programme',
          UI.table([
            { label: '#', cls: 'num', key: 'no' },
            { label: 'Month', cls: 'nowrap', key: 'monthLabel' },
            { label: 'Article', render: function (r) {
              return '<strong>' + esc(r.title) + '</strong>' +
                '<div class="muted" style="font-size:11px;margin-top:2px">Target: ' +
                esc(r.keyword) + '</div>';
            } },
            { label: 'Funnel', cls: 'nowrap', render: function (r) {
              return '<span class="pill ' + (r.funnel === 'BOFU' ? 'ok'
                : (r.funnel === 'MOFU' ? 'prog' : 'idle')) + '">' + esc(r.funnel) + '</span>';
            } },
            { label: 'Intent', cls: 'nowrap', key: 'intent' },
            { label: 'Traffic / Lead Goal', key: 'goal' },
            { label: 'Owner', cls: 'nowrap', key: 'owner' },
            { label: 'Status', cls: 'nowrap', render: function (r) {
              return UI.delivStatusPill(r.status === 'Published' ? 'Delivered'
                : (r.status === 'Drafting' ? 'In Progress' : r.status)) +
                (r.status === 'Published' && r.publishedOn
                  ? '<div class="muted" style="font-size:10.5px;margin-top:2px">' +
                    esc(PMO.fmtDate(r.publishedOn)) + '</div>' : '');
            } }
          ], lib.editorial), { tight: true });
    }

    if (ph.id === 'p4' && lib.gbpElements) {
      out += UI.sectionTitle('Appendix — Google Business Profile Specification', lib.gbpElements.length) +
        UI.card('GBP Domination Plan', 'Source sheet: Phase 4 — Local SEO & GBP',
          UI.table([
            { label: 'Profile Element', render: function (r) {
              return '<strong>' + esc(r.element) + '</strong>';
            } },
            { label: 'Optimization Standard', key: 'standard' },
            { label: 'Howrah Bridge Deployment', key: 'deployment' },
            { label: 'Cadence', cls: 'nowrap', key: 'cadence' },
            { label: 'Status', cls: 'nowrap', render: function (r) {
              return UI.delivStatusPill(r.status === 'Live' ? 'Delivered' : r.status);
            } }
          ], lib.gbpElements), { tight: true });
    }

    if (ph.id === 'p5' && lib.metaCampaigns) {
      out += UI.sectionTitle('Appendix — Meta Ads Architecture', lib.metaCampaigns.length + ' campaigns') +
        UI.card('Meta (Facebook & Instagram) Paid Architecture',
          'Source sheet: Phase 6 — Meta Ads Plan · combined monthly budget ' +
            PMO.inr(sum(lib.metaCampaigns, 'budget')),
          UI.table([
            { label: 'Campaign', render: function (r) {
              return '<strong>' + esc(r.name) + '</strong>' +
                '<div class="muted" style="font-size:11px;margin-top:2px">' + esc(r.objective) + '</div>';
            } },
            { label: 'Audience & Geofence', key: 'audience' },
            { label: 'Creative Hook', key: 'hook' },
            { label: 'Format', cls: 'nowrap', key: 'format' },
            { label: 'Budget / mo', cls: 'num nowrap', render: function (r) {
              return '<strong>' + PMO.inr(r.budget) + '</strong>';
            } },
            { label: 'Target KPIs', key: 'kpi' }
          ], lib.metaCampaigns), { tight: true });
    }

    if (ph.id === 'p6' && lib.googleCampaigns) {
      out += UI.sectionTitle('Appendix — Google Ads Architecture', lib.googleCampaigns.length + ' campaigns') +
        UI.card('High-Intent Search, Performance Max & Call Ads',
          'Source sheet: Phase 7 — Google Ads Plan · combined monthly budget ' +
            PMO.inr(sum(lib.googleCampaigns, 'budget')),
          UI.table([
            { label: 'Campaign Theme', render: function (r) {
              return '<strong>' + esc(r.theme) + '</strong>';
            } },
            { label: 'Match Types & Keywords', render: function (r) {
              return '<span style="font-family:ui-monospace,Menlo,monospace;font-size:11px">' +
                esc(r.keywords) + '</span>';
            } },
            { label: 'Bidding Strategy', key: 'bidding' },
            { label: 'Est. CPC', cls: 'nowrap', key: 'cpc' },
            { label: 'Budget / mo', cls: 'num nowrap', render: function (r) {
              return '<strong>' + PMO.inr(r.budget) + '</strong>';
            } },
            { label: 'Conversion Objective', key: 'objective' },
            { label: 'Target Monthly Leads', render: function (r) {
              return '<strong>' + esc(r.targetLeads) + '</strong>';
            } }
          ], lib.googleCampaigns), { tight: true });
    }

    if (ph.id === 'p7' && lib.linkTiers) {
      out += UI.sectionTitle('Appendix — Link Acquisition Tiers', lib.linkTiers.length + ' tiers') +
        UI.card('Strategic Link Building, Local PR & Authority Acquisition',
          'Source sheet: Phase 9 — Link Building & PR · annual target ' +
            sum(lib.linkTiers, 'annualTarget') + ' links, ' +
            sum(lib.linkTiers, 'acquired') + ' acquired to date',
          UI.table([
            { label: 'Tier & Channel', render: function (r) {
              return '<strong>' + esc(r.tier) + '</strong>';
            } },
            { label: 'Target Media & Outlets', key: 'outlets' },
            { label: 'Target DR', cls: 'nowrap', key: 'dr' },
            { label: 'Editorial Pitch Angle', key: 'pitch' },
            { label: 'Progress', render: function (r) {
              return UI.miniBar(r.annualTarget ? (r.acquired / r.annualTarget) * 100 : 0,
                r.acquired >= r.annualTarget ? 'ok' : '') +
                '<div class="muted" style="font-size:10.5px;margin-top:3px">' + r.acquired +
                ' of ' + r.annualTarget + ' annual</div>';
            } },
            { label: 'Quarterly Milestone', key: 'quarterly' }
          ], lib.linkTiers), { tight: true });
    }

    if (ph.id === 'p8' && lib.croItems) {
      out += UI.sectionTitle('Appendix — CRO Opportunity Register', lib.croItems.length) +
        UI.card('Conversion Rate Optimization & Landing Page Architecture',
          'Source sheet: Phase 8 — CRO & Funnels',
          UI.table([
            { label: 'Funnel Area', render: function (r) {
              return '<strong>' + esc(r.area) + '</strong>';
            } },
            { label: 'Baseline Friction Point', key: 'friction' },
            { label: 'Recommended Enhancement', key: 'enhancement' },
            { label: 'Priority', cls: 'nowrap', render: function (r) { return UI.priority(r.priority); } },
            { label: 'Projected Uplift', cls: 'nowrap', render: function (r) {
              return '<strong style="color:#1c7a30">' + esc(r.uplift) + '</strong>';
            } },
            { label: 'Technical Component', key: 'component' }
          ], lib.croItems), { tight: true });
    }

    if (ph.id === 'p9' && PMO.program && PMO.program.kpiTargets) {
      out += UI.sectionTitle('Appendix — Executive KPI Model', PMO.program.kpiTargets.length + ' metrics') +
        UI.card('12-Month KPI Targets & Tracking Sources',
          'Source sheet: Phase 11 — KPI Dashboard',
          UI.table([
            { label: 'Strategic Metric', render: function (r) {
              return '<strong>' + esc(r.metric) + '</strong>';
            } },
            { label: 'Baseline (M0)', cls: 'num nowrap', key: 'baseline' },
            { label: 'Month 6 Target', cls: 'num nowrap', key: 'm6' },
            { label: 'Month 12 Goal', cls: 'num nowrap', render: function (r) {
              return '<strong>' + esc(r.m12) + '</strong>';
            } },
            { label: 'Current', cls: 'num nowrap', render: function (r) {
              return '<strong style="color:#1d4ed8">' + esc(r.current || '—') + '</strong>';
            } },
            { label: 'To Goal', render: function (r) {
              return UI.miniBar(r.pctToGoal || 0, (r.pctToGoal || 0) >= 90 ? 'ok'
                : ((r.pctToGoal || 0) >= 60 ? '' : 'warn'));
            } },
            { label: 'Tracking Platform', key: 'source' }
          ], PMO.program.kpiTargets), { tight: true });
    }

    return out;
  }

  function sum(arr, key) {
    return (arr || []).reduce(function (a, b) { return a + (Number(b[key]) || 0); }, 0);
  }

  PMO.views = PMO.views || {};
  PMO.views.phase = {
    render: function (id) {
      var ph = PMO.phaseById[id];
      if (!ph) return '<div class="empty-state">Phase not found.</div>';
      return hero(ph) +
        summaryStrip(ph) +
        UI.sectionTitle('Module Delivery Board', ph.moduleCount + ' modules') +
        moduleTable(ph) +
        UI.sectionTitle('Module Register') +
        moduleRegister(ph) +
        UI.sectionTitle('Phase Gantt Timeline') +
        gantt(ph) +
        UI.sectionTitle('Deliverables Tracker') +
        deliverables(ph) +
        UI.sectionTitle('Risk Register') +
        risks(ph) +
        kpis(ph) +
        appendix(ph) +
        (ph.notes ? '<div class="note" style="margin-top:22px"><b>Methodology note:</b> ' +
          esc(ph.notes) + '</div>' : '');
    },
    titleFor: function (id) {
      var ph = PMO.phaseById[id];
      return ph ? ('Phase ' + ph.number + ' — ' + ph.name) : 'Phase';
    }
  };
})(window.PMO);
