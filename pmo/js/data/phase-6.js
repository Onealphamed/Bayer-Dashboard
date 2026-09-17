/* Phase 6 — Google Ads  |  source sheet: "Phase 7 - Google Ads Plan" */
PMO.registerPhase({
  id: 'p6',
  number: 6,
  name: 'Google Ads',
  subtitle: 'High-intent search, Performance Max and call ads on ₹1,20,000 a month',
  sourceSheet: 'Phase 7 - Google Ads Plan',
  objective: 'Capture bottom-of-funnel demand at the moment it is expressed in Google search, across the four commercial themes the workbook funds: corporate catering in BKC, Powai and Andheri at a ₹450 target CPA, Bengali wedding and large-event catering at a 600% target ROAS, house party and birthday catering at a ₹280 target CPA, and daily meal and tiffin subscriptions. Performance Max carries local store and food-order intent against a ₹160 target CPA, while remarketing, call and local extensions convert the audiences the search themes generate. The full monthly envelope is ₹1,20,000.',
  expectedOutcome: '165 to 200 qualified catering leads and 120 to 150 tiffin trial sign-ups per month from paid search, plus 150+ direct menu orders and 200+ Maps clicks from Performance Max, at a blended paid ROAS approaching the Month 12 goal of 4.2x.',
  riskLevel: 'Medium',
  health: 'amber',
  extraColumns: [
    { key: 'budget', label: 'Monthly Budget' },
    { key: 'cpc', label: 'Est. CPC' },
    { key: 'leads', label: 'Target Monthly Leads' }
  ],
  modules: [
    {
      id: 'p6-m1',
      name: 'Search Campaigns',
      summary: 'The four funded search themes from the Phase 7 sheet run as one campaign structure with a theme per ad group: Corporate Catering BKC/Powai/Andheri (₹30,000, Maximize Conversions at ₹450 target CPA), Wedding & Large Event (₹25,000, Maximize Conversion Value at 600% target ROAS), House Party & Birthday (₹20,000, ₹280 target CPA) and Daily Meal & Tiffin Subscriptions (₹20,000, Maximize Clicks & Conversions).',
      owners: ['Karan G.', 'Aditya T.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-11-01',
      end: '2026-09-30',
      expectedOutcome: '165 to 200 qualified catering leads and 120 to 150 tiffin trial sign-ups per month from exact and phrase match coverage of the commercial keyword set.',
      dependencies: ['p1-m5', 'p3-m1'],
      metrics: {
        budget: '₹95,000 / mo',
        cpc: '₹14 – ₹65',
        leads: '285 – 350 leads & sign-ups'
      },
      tasks: [
        { id: 'p6-m1-t1', name: 'Launch the corporate ad group on [corporate catering mumbai] and +corporate +catering +powai', status: 'completed', due: '2025-11-14', owner: 'Karan G.' },
        { id: 'p6-m1-t2', name: 'Set Maximize Conversions at a ₹450 target CPA on the corporate inquiry and call actions', status: 'completed', due: '2025-11-28', owner: 'Karan G.' },
        { id: 'p6-m1-t3', name: 'Open the house party ad group on [small party caterers near me] at a ₹280 target CPA', status: 'completed', due: '2025-12-12', owner: 'Karan G.' },
        { id: 'p6-m1-t4', name: 'Stand up the tiffin ad group on "tiffin service andheri east" and [daily lunch delivery powai]', status: 'completed', due: '2026-01-16', owner: 'Karan G.' },
        { id: 'p6-m1-t5', name: 'Build a 42-term negative list stripping recipe, jobs, franchise and aggregator queries', status: 'completed', due: '2026-03-20', owner: 'Aditya T.' },
        { id: 'p6-m1-t6', name: 'Move the wedding ad group to Maximize Conversion Value at a 600% target ROAS', status: 'completed', due: '2026-06-26', owner: 'Karan G.' },
        { id: 'p6-m1-t7', name: 'Lift the wedding CPC ceiling above ₹65 to recover lost impression share on bridal terms', status: 'in-progress', due: '2026-09-11', owner: 'Karan G.' },
        { id: 'p6-m1-t8', name: 'Rebalance the ₹95,000 search envelope across the four themes for the Month 12 close', status: 'in-progress', due: '2026-09-30', owner: 'Karan G.' }
      ],
      deliverables: [
        { name: 'Four-theme search campaign build with match-type and bidding map', status: 'Delivered', due: '2026-01-16', owner: 'Karan G.', dependency: 'GTM conversion actions from Phase 1 tracking build', priority: 'Critical' },
        { name: 'Negative keyword and search-term governance list (42 terms)', status: 'Delivered', due: '2026-03-20', owner: 'Aditya T.', dependency: '—', priority: 'High' },
        { name: 'Wedding ROAS bidding migration and per-plate value model', status: 'Delivered', due: '2026-06-26', owner: 'Karan G.', dependency: 'Per-plate pricing sheets (Howrah Ops)', priority: 'High' },
        { name: 'Month 12 budget rebalance and search account handover pack', status: 'In Progress', due: '2026-09-30', owner: 'Karan G.', dependency: 'Client spend approval for Q4 shift', priority: 'Medium' }
      ]
    },
    {
      id: 'p6-m2',
      name: 'Performance Max',
      summary: 'Performance Max (Local Store & Food Orders) deployed in Month 4 per the roadmap, at ₹25,000 a month on a ₹160 target CPA, with one asset group combining food photography, Google Maps local pins and search intent signals against direct menu orders, Maps directions and calls.',
      owners: ['Karan G.', 'Riya S.'],
      priority: 'High',
      status: 'in-progress',
      start: '2026-01-05',
      end: '2026-09-30',
      expectedOutcome: '150+ direct menu orders and 200+ Maps clicks per month, once blended acquisition cost is pulled back to the ₹160 target CPA.',
      dependencies: ['p6-m1', 'p1-m6'],
      metrics: {
        budget: '₹25,000 / mo',
        cpc: '₹18 – ₹28',
        leads: '150+ orders & 200+ Maps clicks'
      },
      tasks: [
        { id: 'p6-m2-t1', name: 'Build the asset group from food photography, Maps local pins and search intent signals', status: 'completed', due: '2026-01-23', owner: 'Riya S.' },
        { id: 'p6-m2-t2', name: 'Launch Performance Max at ₹25,000 a month on a ₹160 target CPA', status: 'completed', due: '2026-01-30', owner: 'Karan G.' },
        { id: 'p6-m2-t3', name: 'Feed the six GBP catalog categories into the Performance Max listing group', status: 'completed', due: '2026-02-20', owner: 'Meera S.' },
        { id: 'p6-m2-t4', name: 'Refine target CPA bidding after the Month 5 seasonal comfort-craving spend shift', status: 'completed', due: '2026-02-27', owner: 'Karan G.' },
        { id: 'p6-m2-t5', name: 'Diagnose the ₹214 blended CPA overshoot against the ₹160 target and reset bids', status: 'in-progress', due: '2026-09-05', owner: 'Karan G.' },
        { id: 'p6-m2-t6', name: 'Apply brand and aggregator exclusions so Swiggy and Zomato queries stop absorbing spend', status: 'in-progress', due: '2026-09-22', owner: 'Aditya T.' },
        { id: 'p6-m2-t7', name: 'Split a Powai-only asset group to isolate the Maps directions signal from order volume', status: 'not-started', due: '2026-09-25', owner: 'Karan G.' }
      ],
      deliverables: [
        { name: 'Performance Max asset group with food photography and Maps pin set', status: 'Delivered', due: '2026-01-30', owner: 'Riya S.', dependency: 'Brand media bank from Phase 5 production', priority: 'High' },
        { name: 'CPA remediation plan against the ₹160 target (current ₹214)', status: 'In Review', due: '2026-09-19', owner: 'Karan G.', dependency: 'GA4 order-value backfill (Aditya T.)', priority: 'Critical' },
        { name: 'Brand and aggregator exclusion list for Performance Max', status: 'In Progress', due: '2026-09-22', owner: 'Aditya T.', dependency: 'Google account-level exclusion approval', priority: 'High' }
      ]
    },
    {
      id: 'p6-m3',
      name: 'Remarketing',
      summary: 'Search remarketing built on the audiences the catering themes generate: RLSA bid modifiers on 30-day catering-page visitors and cost-calculator abandoners, plus a Customer Match list of the 77 dormant regulars carrying the BRIDGE20 win-back offer. Funded through bid adjustments inside the ₹95,000 search envelope rather than incremental budget.',
      owners: ['Karan G.', 'Aditya T.'],
      priority: 'High',
      status: 'in-progress',
      start: '2026-02-02',
      end: '2026-09-30',
      expectedOutcome: 'Recovery of catering searchers who left without converting, and reactivation of 25+ dormant regulars from the ₹6.9L lapsed-revenue cohort.',
      dependencies: ['p6-m1'],
      metrics: {
        budget: 'Within ₹95,000 search envelope',
        cpc: '₹16 – ₹34 (RLSA bid-adjusted)',
        leads: '25+ regulars reactivated / mo'
      },
      tasks: [
        { id: 'p6-m3-t1', name: 'Build RLSA audiences from 30-day catering-page visitors and calculator abandoners', status: 'completed', due: '2026-02-20', owner: 'Aditya T.' },
        { id: 'p6-m3-t2', name: 'Apply +45% RLSA bid modifiers on corporate and wedding catering search terms', status: 'completed', due: '2026-03-13', owner: 'Karan G.' },
        { id: 'p6-m3-t3', name: 'Upload the 77 dormant regulars as a hashed Customer Match list for search', status: 'completed', due: '2026-04-10', owner: 'Aditya T.' },
        { id: 'p6-m3-t4', name: 'Run BRIDGE20 win-back RLSA copy against the 41 lapsed regulars past 150 days', status: 'completed', due: '2026-05-15', owner: 'Karan G.' },
        { id: 'p6-m3-t5', name: 'Extend RLSA coverage to the tiffin trial drop-off audience from the subscription funnel', status: 'completed', due: '2026-07-24', owner: 'Karan G.' },
        { id: 'p6-m3-t6', name: 'Hold RLSA frequency under 4 impressions per user per week through the Month 12 push', status: 'in-progress', due: '2026-09-30', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'RLSA audience architecture and bid modifier schedule', status: 'Delivered', due: '2026-03-13', owner: 'Karan G.', dependency: 'GA4 audience export (p1-m6)', priority: 'High' },
        { name: 'Customer Match win-back segment for the 77 dormant regulars', status: 'Delivered', due: '2026-05-15', owner: 'Aditya T.', dependency: 'Consented CRM list from Howrah Ops', priority: 'High' },
        { name: 'Remarketing frequency and incrementality review', status: 'In Progress', due: '2026-09-30', owner: 'Aditya T.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p6-m4',
      name: 'Call Campaigns',
      summary: 'Call-only ads scheduled to the 11:00 to 14:00 lunch ordering window, where corporate catering and house party intent converts by phone rather than form. Calls route to the Powai kitchen line, count as conversions past 30 seconds, and feed the same ₹450 target CPA corporate objective as the search theme.',
      owners: ['Karan G.', 'Howrah Ops'],
      priority: 'Medium',
      status: 'completed',
      start: '2026-03-02',
      end: '2026-08-21',
      expectedOutcome: 'A second conversion path for corporate and party inquiries that captures mobile searchers during the kitchen window without adding incremental media budget.',
      dependencies: ['p6-m1'],
      metrics: {
        budget: 'Within ₹30,000 corporate line',
        cpc: '₹34 – ₹52',
        leads: '40 – 50 tracked calls / mo'
      },
      tasks: [
        { id: 'p6-m4-t1', name: 'Launch call-only ads on an 11:00 to 14:00 weekday lunch ad schedule', status: 'completed', due: '2026-03-20', owner: 'Karan G.' },
        { id: 'p6-m4-t2', name: 'Route ad calls to the Powai kitchen line with a 30-second conversion threshold', status: 'completed', due: '2026-03-27', owner: 'Karan G.' },
        { id: 'p6-m4-t3', name: 'Add call assets to the corporate and house party ad groups on mobile', status: 'completed', due: '2026-04-17', owner: 'Karan G.' },
        { id: 'p6-m4-t4', name: 'Set a -100% bid adjustment outside kitchen hours to stop unanswered calls', status: 'completed', due: '2026-05-08', owner: 'Karan G.' },
        { id: 'p6-m4-t5', name: 'Train the kitchen desk on the catering call script and RFP capture fields', status: 'completed', due: '2026-06-19', owner: 'Howrah Ops' },
        { id: 'p6-m4-t6', name: 'Reconcile tracked calls against WhatsApp CRM inquiries for the June to August quarter', status: 'completed', due: '2026-08-21', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Call-only campaign with lunch-window ad schedule and call tracking', status: 'Delivered', due: '2026-03-27', owner: 'Karan G.', dependency: 'Kitchen line forwarding number', priority: 'High' },
        { name: 'Catering call script and RFP capture sheet for the kitchen desk', status: 'Delivered', due: '2026-06-19', owner: 'Howrah Ops', dependency: 'Duty roster cover for 11:00 to 14:00', priority: 'Medium' },
        { name: 'Call-to-CRM reconciliation for Q2 tracked calls', status: 'Delivered', due: '2026-08-21', owner: 'Aditya T.', dependency: 'WhatsApp Business API export', priority: 'Medium' }
      ]
    },
    {
      id: 'p6-m5',
      name: 'Local Campaigns',
      summary: 'Local inventory and store-visit assets driving Maps directions to the Powai Hub off Saki Vihar Road, run inside the Performance Max local surface against the 3 to 5 km home-turf radius that already delivers 55.3% of audited sales across Emerald Isle, Godrej Platinum and Lake Homes.',
      owners: ['Karan G.', 'Meera S.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2026-04-06',
      end: '2026-09-30',
      expectedOutcome: '200+ Maps clicks a month into the Powai Hub profile, converting proximity into directions requests and direct kitchen orders.',
      dependencies: ['p6-m2', 'p4-m1'],
      metrics: {
        budget: 'Within ₹25,000 Performance Max line',
        cpc: '₹18 – ₹28',
        leads: '200+ Maps clicks / mo'
      },
      tasks: [
        { id: 'p6-m5-t1', name: 'Link the verified Powai Hub location group to the Google Ads account', status: 'completed', due: '2026-04-17', owner: 'Meera S.' },
        { id: 'p6-m5-t2', name: 'Launch the store-visit and directions asset group on the Powai Hub listing', status: 'completed', due: '2026-05-15', owner: 'Karan G.' },
        { id: 'p6-m5-t3', name: 'Geofence the 3 to 5 km radius over Emerald Isle, Godrej Platinum and Lake Homes', status: 'completed', due: '2026-06-26', owner: 'Karan G.' },
        { id: 'p6-m5-t4', name: 'Attribute Maps directions requests against the +42% GBP visual media uplift', status: 'in-progress', due: '2026-09-30', owner: 'Aditya T.' },
        { id: 'p6-m5-t5', name: 'Extend local coverage to the Kanjurmarg East and Godrej Platinum expansion clusters', status: 'not-started', due: '2026-09-11', owner: 'Karan G.' },
        { id: 'p6-m5-t6', name: 'Publish the local ads playbook for the Month 12 client handover', status: 'not-started', due: '2026-09-28', owner: 'Karan G.' }
      ],
      deliverables: [
        { name: 'Location group link and Powai Hub store-visit asset group', status: 'Delivered', due: '2026-05-15', owner: 'Meera S.', dependency: 'Verified GBP listing (p4-m1)', priority: 'High' },
        { name: 'Home-turf geofence map across the 3 to 5 km Powai radius', status: 'Delivered', due: '2026-06-26', owner: 'Karan G.', dependency: '—', priority: 'Medium' },
        { name: 'Maps directions attribution report and local ads playbook', status: 'Pending', due: '2026-09-28', owner: 'Karan G.', dependency: 'GBP Performance Insights export', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R6.1',
      risk: 'Performance Max is acquiring at a blended ₹214 CPA against the ₹160 target, absorbing the ₹25,000 line without reaching the 150 direct orders a month objective.',
      impact: 'High', probability: 'High', owner: 'Karan G.',
      mitigation: 'Brand and aggregator exclusions applied, order value backfilled into GA4 so bidding optimises on revenue rather than order count, and a Powai-only asset group split to isolate the Maps signal from paid order volume.',
      status: 'Mitigating' },
    { id: 'R6.2',
      risk: 'Bridal auction pressure has pushed wedding catering CPCs to the top of the ₹42 to ₹65 band, costing impression share against established Mumbai caterers before the winter wedding season.',
      impact: 'High', probability: 'Medium', owner: 'Karan G.',
      mitigation: 'Bidding moved to Maximize Conversion Value at a 600% target ROAS so the ₹1.5L+ AOV carries the bid, with the CPC ceiling lifted only on [bengali wedding caterers mumbai] where conversion value is proven.',
      status: 'Mitigating' },
    { id: 'R6.3',
      risk: 'Call-only ads depend on the kitchen desk answering inside the 11:00 to 14:00 window; unanswered calls are billed as clicks and lose corporate inquiries outright.',
      impact: 'Medium', probability: 'Medium', owner: 'Howrah Ops',
      mitigation: 'A -100% bid adjustment suppresses serving outside kitchen hours, a 30-second conversion threshold exposes drop-offs, and the kitchen desk works to a scripted catering intake sheet.',
      status: 'Monitoring' },
    { id: 'R6.4',
      risk: 'Performance Max and the local asset group both claim Maps clicks and direct orders, so paid volume is double counted against the Phase 11 direct-order and GBP targets.',
      impact: 'Medium', probability: 'Medium', owner: 'Aditya T.',
      mitigation: 'Directions requests reconciled monthly between GBP Performance Insights and Google Ads, with the local asset group reported separately from the order-driven asset group.',
      status: 'Open' },
    { id: 'R6.5',
      risk: 'Tiffin subscription terms at ₹14 to ₹24 CPC carry a ₹4,500 monthly AOV but a long payback, so aggressive trial acquisition can run ahead of kitchen subscription capacity.',
      impact: 'Medium', probability: 'Low', owner: 'Karan G.',
      mitigation: 'Trial sign-ups capped against the 250 active-subscriber Month 12 run-rate model, with spend throttled when weekly trial volume exceeds kitchen dispatch headroom.',
      status: 'Monitoring' },
    { id: 'R6.6',
      risk: 'Paid catering traffic still lands on the legacy six-field contact form carrying 82% abandonment, wasting high-cost clicks from the ₹450 and ₹280 target CPA ad groups.',
      impact: 'High', probability: 'Medium', owner: 'Aditya T.',
      mitigation: 'Corporate and house party traffic redirected to the three-step catering cost calculator landing page, with the WhatsApp estimate path set as the primary conversion action.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Qualified B2B corporate leads', baseline: '~2 / mo', target: '65 – 75', current: '68', unit: '/ mo', direction: 'up' },
    { label: 'Bridal leads at ₹1.5L+ AOV', baseline: '0', target: '30 – 40', current: '31', unit: '/ mo', direction: 'up' },
    { label: 'House party & birthday leads', baseline: '~4 / mo', target: '70 – 85', current: '74', unit: '/ mo', direction: 'up' },
    { label: 'Tiffin trial sign-ups', baseline: '~15', target: '120 – 150', current: '118', unit: '/ mo', direction: 'up' },
    { label: 'Performance Max blended CPA', baseline: '₹310', target: '₹160', current: '₹214', unit: '', direction: 'down' },
    { label: 'Blended paid advertising ROAS', baseline: '~1.8x', target: '4.2x+', current: '3.9x', unit: '', direction: 'up' }
  ],
  notes: 'Campaign themes, match types, bidding strategies, CPC bands, monthly budgets and conversion targets are taken verbatim from the Phase 7 sheet; the four search themes are consolidated into one campaign structure with a theme per ad group. Remarketing, call and local campaigns are agency extensions funded from the same ₹1,20,000 envelope through bid adjustments, not incremental spend. Launch timing follows the Phase 10 roadmap (Google Search from Month 1 to 2, Performance Max in Month 4, wedding budget increase in Month 9). Current values were read from Google Ads and GA4 on 15 Sep 2026.'
});
