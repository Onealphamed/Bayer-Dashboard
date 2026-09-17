/* Phase 9 — Reporting & Analytics  |  source sheet: "Phase 11 - KPI Dashboard" */
PMO.registerPhase({
  id: 'p9',
  number: 9,
  name: 'Reporting & Analytics',
  subtitle: 'Ten-metric executive KPI dashboard and the Month 12 direct revenue run-rate model',
  sourceSheet: 'Phase 11 - KPI Dashboard',
  objective: 'Operationalise the Phase 11 executive KPI dashboard so every one of the ten strategic performance metrics is measured continuously against its Month 0 baseline, its Month 6 milestone and its Month 12 goal, on the tracking platform the workbook names for it. The phase turns ten separate tools — GA4, SEMrush and Ahrefs, Google Search Console, the CRM and WhatsApp Business API, Direct Checkout, the Subscription Management Database, GBP Performance Insights, Google Maps Profile, the ad spend against direct GMV ledger and Meta Business Suite — into one reporting cadence the client leadership group can act on. It also owns the 12-month direct revenue projection model that converts the programme into a defensible ₹30,62,500 monthly run-rate at Month 12.',
  expectedOutcome: 'A single consolidated reporting layer covering all ten Phase 11 metrics, plus a reconciled Month 12 run-rate model showing ₹11,25,000 of monthly tiffin subscription revenue, ₹8,12,500 of direct à-la-carte revenue and ₹11,25,000 of catering revenue, evidenced against source-system exports rather than platform-reported figures.',
  riskLevel: 'Low',
  health: 'green',
  extraColumns: [
    { key: 'cadence', label: 'Reporting Cadence' },
    { key: 'source', label: 'Tracking Platform' }
  ],
  modules: [
    {
      id: 'p9-m1',
      name: 'SEO Reports',
      summary: 'Owns the two organic ranking lines of the Phase 11 dashboard: keywords ranking in the top 3 on Google India (baseline < 5, 35 at Month 6, 110+ at Month 12) tracked in SEMrush and Ahrefs, and keywords ranking in the top 10 (baseline < 20, 120 at Month 6, 300+ at Month 12) read from Google Search Console. Reporting is cut by the five Phase 3 keyword clusters — Bengali Food Mumbai, Corporate Catering Mumbai, Wedding & Event Catering, Daily Meals & Tiffins and Hyper-Local Hubs.',
      owners: ['Sohini B.', 'Aditya T.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-10-12',
      end: '2026-09-30',
      expectedOutcome: 'Month-on-month visibility of rank movement across all 27 funded target keywords, so budget can be moved between clusters on evidence rather than on opinion.',
      dependencies: ['p1-m6'],
      metrics: {
        cadence: 'Monthly pack + weekly rank pulse',
        source: 'SEMrush / Ahrefs + Google Search Console'
      },
      tasks: [
        { id: 'p9-m1-t1', name: 'Stand up the SEMrush rank-tracking project for the 27 Phase 3 target keywords', status: 'completed', due: '2025-10-24', owner: 'Sohini B.' },
        { id: 'p9-m1-t2', name: 'Connect Search Console and map top-10 reporting to the five keyword clusters', status: 'completed', due: '2025-11-07', owner: 'Aditya T.' },
        { id: 'p9-m1-t3', name: 'Publish the Month 6 SEO pack against the 35 top-3 and 120 top-10 milestones', status: 'completed', due: '2026-03-31', owner: 'Sohini B.' },
        { id: 'p9-m1-t4', name: 'Add Ahrefs referring-domain and DR movement to the monthly SEO pack', status: 'completed', due: '2026-06-30', owner: 'Sohini B.' },
        { id: 'p9-m1-t5', name: 'Issue the Month 11 pack covering the healthy daily meals Mumbai tiffin terms', status: 'completed', due: '2026-08-31', owner: 'Sohini B.' },
        { id: 'p9-m1-t6', name: 'Reconcile SEMrush top-3 counts against Search Console average position data', status: 'in-progress', due: '2026-09-12', owner: 'Aditya T.' },
        { id: 'p9-m1-t7', name: 'Compile the Month 12 rank report against the 110+ top-3 and 300+ top-10 goals', status: 'in-progress', due: '2026-09-24', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'SEMrush and Ahrefs rank-tracking project across the 27 target keywords', status: 'Delivered', due: '2025-10-24', owner: 'Sohini B.', dependency: 'Phase 3 keyword architecture sign-off', priority: 'High' },
        { name: 'Monthly SEO performance pack by keyword cluster (11 issues)', status: 'Delivered', due: '2026-08-31', owner: 'Sohini B.', dependency: '—', priority: 'High' },
        { name: 'Month 12 rank position report (top-3 and top-10 against goal)', status: 'In Progress', due: '2026-09-24', owner: 'Sohini B.', dependency: 'Search Console September data refresh', priority: 'High' }
      ]
    },
    {
      id: 'p9-m2',
      name: 'Ads Reports',
      summary: 'Reports the two paid lines of the Phase 11 dashboard: blended paid advertising ROAS measured as ad spend against direct GMV (baseline ~1.8x, 3.2x at Month 6, 4.2x+ at Month 12) and hyper-local Instagram following read from Meta Business Suite (baseline < 1,500, 10,000 at Month 6, 25,000+ at Month 12). Covers the ₹1,20,000 monthly Meta budget across the seven funded campaigns and the ₹1,20,000 monthly Google budget across the five campaign themes.',
      owners: ['Devika V.', 'Karan G.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-10-20',
      end: '2026-09-30',
      expectedOutcome: 'A weekly paid media view that ties every rupee of the ₹2,40,000 monthly ad spend to direct GMV, protecting the shift away from a discount-led CAC model.',
      dependencies: ['p1-m5', 'p6-m2'],
      metrics: {
        cadence: 'Weekly scorecard + monthly review',
        source: 'Ad Spend vs Direct GMV + Meta Business Suite'
      },
      tasks: [
        { id: 'p9-m2-t1', name: 'Build the Meta Business Suite reporting view for the seven funded campaigns', status: 'completed', due: '2025-11-14', owner: 'Devika V.' },
        { id: 'p9-m2-t2', name: 'Define blended ROAS as total ad spend divided by direct GMV, excluding aggregators', status: 'completed', due: '2025-12-05', owner: 'Aditya T.' },
        { id: 'p9-m2-t3', name: 'Publish the Month 6 paid media review against the 3.2x blended ROAS milestone', status: 'completed', due: '2026-03-31', owner: 'Karan G.' },
        { id: 'p9-m2-t4', name: 'Add Performance Max and ₹160 target CPA reporting to the weekly ads scorecard', status: 'completed', due: '2026-05-29', owner: 'Karan G.' },
        { id: 'p9-m2-t5', name: 'Report Instagram follower growth against the 25,000+ Month 12 goal', status: 'completed', due: '2026-08-14', owner: 'Devika V.' },
        { id: 'p9-m2-t6', name: 'Reconcile Meta CAPI and Google Ads conversions against Direct Checkout orders', status: 'in-progress', due: '2026-09-11', owner: 'Aditya T.' },
        { id: 'p9-m2-t7', name: 'Produce the Month 12 blended ROAS report across ₹2,40,000 of monthly spend', status: 'in-progress', due: '2026-09-25', owner: 'Karan G.' }
      ],
      deliverables: [
        { name: 'Blended ROAS measurement definition and spend-to-GMV ledger', status: 'Delivered', due: '2025-12-05', owner: 'Aditya T.', dependency: 'Direct Checkout order feed', priority: 'Critical' },
        { name: 'Weekly paid media scorecard (Meta 7 campaigns, Google 5 themes)', status: 'Delivered', due: '2026-08-14', owner: 'Devika V.', dependency: '—', priority: 'High' },
        { name: 'Month 12 blended ROAS and Instagram growth report', status: 'In Progress', due: '2026-09-25', owner: 'Karan G.', dependency: 'September GMV close from Howrah Ops', priority: 'High' },
        { name: 'Cross-platform conversion reconciliation note (CAPI vs Google Ads vs checkout)', status: 'In Review', due: '2026-09-11', owner: 'Aditya T.', dependency: 'Phase 8 conversion tracking build', priority: 'Medium' }
      ]
    },
    {
      id: 'p9-m3',
      name: 'GBP Reports',
      summary: 'Reports the two local lines of the Phase 11 dashboard: Google Business Profile views and impressions from GBP Performance Insights (baseline ~2,500, 12,000 at Month 6, 35,000+ at Month 12) and total verified 5-star reviews from the Google Maps profile (baseline < 40, 200 at Month 6, 500+ at Month 12). Also tracks the calls and directions-request uplift the Phase 4 weekly five-photo upload cadence is funded to deliver.',
      owners: ['Meera S.', 'Aditya T.'],
      priority: 'Medium',
      status: 'completed',
      start: '2025-10-05',
      end: '2026-09-15',
      expectedOutcome: 'A closed 12-cycle GBP reporting record evidencing local pack performance across the 10 funded postal clusters from Powai through Kanjurmarg.',
      dependencies: ['p4-m1'],
      metrics: {
        cadence: 'Monthly cycle (12 of 12 closed)',
        source: 'GBP Performance Insights + Google Maps Profile'
      },
      tasks: [
        { id: 'p9-m3-t1', name: 'Baseline GBP Insights at ~2,500 monthly views and under 40 verified reviews', status: 'completed', due: '2025-10-17', owner: 'Meera S.' },
        { id: 'p9-m3-t2', name: 'Stand up the monthly GBP report on views, calls and directions requests', status: 'completed', due: '2025-11-21', owner: 'Meera S.' },
        { id: 'p9-m3-t3', name: 'Publish the Month 6 GBP pack against the 12,000-view and 200-review milestones', status: 'completed', due: '2026-03-13', owner: 'Meera S.' },
        { id: 'p9-m3-t4', name: 'Report the 300+ cumulative review milestone from the QR insert card programme', status: 'completed', due: '2026-07-24', owner: 'Meera S.' },
        { id: 'p9-m3-t5', name: 'Track local pack top-3 placement across the 10 funded postal clusters', status: 'completed', due: '2026-09-05', owner: 'Meera S.' },
        { id: 'p9-m3-t6', name: 'Close the Month 12 GBP cycle at 33,400 views and 486 verified 5-star reviews', status: 'completed', due: '2026-09-15', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'GBP Performance Insights baseline and measurement definition', status: 'Delivered', due: '2025-10-17', owner: 'Meera S.', dependency: 'GBP owner access from Howrah Ops', priority: 'Medium' },
        { name: 'Monthly GBP performance pack (12 cycles, views / calls / directions)', status: 'Delivered', due: '2026-09-15', owner: 'Meera S.', dependency: '—', priority: 'Medium' },
        { name: 'Local pack placement report across the 10 postal clusters', status: 'Delivered', due: '2026-09-05', owner: 'Meera S.', dependency: 'Geofenced service area polygons', priority: 'Medium' }
      ]
    },
    {
      id: 'p9-m4',
      name: 'Traffic Reports',
      summary: 'Owns the monthly organic website visits line of the Phase 11 dashboard in GA4 (baseline 1,200, 8,500 at Month 6, 25,000+ at Month 12) and the channel-mix reporting that separates organic, paid, direct and referral demand. This module also carries the automated Looker Studio consolidation that joins GA4, Search Console, Google Ads, Meta and the CRM into one client-facing dashboard, which is still in build and scheduled into the last two weeks of Month 12.',
      owners: ['Aditya T.', 'Rahul K.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-10-05',
      end: '2026-09-30',
      expectedOutcome: 'One automated dashboard replacing manual pack assembly, giving the client a live view of the ten Phase 11 metrics without agency intervention.',
      dependencies: ['p1-m5', 'p1-m6', 'p8-m6'],
      metrics: {
        cadence: 'Weekly pulse + monthly pack (automating)',
        source: 'Google Analytics 4 (GA4)'
      },
      tasks: [
        { id: 'p9-m4-t1', name: 'Install GA4 and GTM and baseline monthly organic visits at 1,200', status: 'completed', due: '2025-10-14', owner: 'Rahul K.' },
        { id: 'p9-m4-t2', name: 'Configure the 12 GA4 conversion events across order, lead and subscription paths', status: 'completed', due: '2025-11-28', owner: 'Aditya T.' },
        { id: 'p9-m4-t3', name: 'Ship the channel-mix report splitting organic, paid, direct and referral sessions', status: 'completed', due: '2026-01-30', owner: 'Aditya T.' },
        { id: 'p9-m4-t4', name: 'Publish the Month 6 traffic pack against the 8,500 organic-visit milestone', status: 'completed', due: '2026-03-31', owner: 'Aditya T.' },
        { id: 'p9-m4-t5', name: 'Add landing-page reporting for the Powai, Andheri East and BKC location silos', status: 'completed', due: '2026-07-31', owner: 'Aditya T.' },
        { id: 'p9-m4-t6', name: 'Validate GA4 session attribution against UTM tags on the GBP menu catalog links', status: 'in-progress', due: '2026-09-16', owner: 'Rahul K.' },
        { id: 'p9-m4-t7', name: 'Build the Looker Studio consolidation joining GA4, GSC, Ads, Meta and the CRM', status: 'in-progress', due: '2026-09-26', owner: 'Aditya T.' },
        { id: 'p9-m4-t8', name: 'Publish the automated Looker Studio dashboard to the client stakeholder group', status: 'not-started', due: '2026-09-29', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'GA4 and GTM measurement plan with 12 mapped conversion events', status: 'Delivered', due: '2025-11-28', owner: 'Aditya T.', dependency: 'Client staging access', priority: 'Critical' },
        { name: 'Monthly traffic and channel-mix pack (11 issues)', status: 'Delivered', due: '2026-07-31', owner: 'Aditya T.', dependency: '—', priority: 'High' },
        { name: 'Looker Studio consolidated KPI dashboard (10 Phase 11 metrics)', status: 'In Progress', due: '2026-09-26', owner: 'Aditya T.', dependency: 'CRM and subscription database connectors', priority: 'Critical' },
        { name: 'Stakeholder access rollout and dashboard handover guide', status: 'Pending', due: '2026-09-29', owner: 'Aditya T.', dependency: 'Looker Studio consolidation sign-off', priority: 'High' }
      ]
    },
    {
      id: 'p9-m5',
      name: 'Lead Reports',
      summary: 'Reports monthly qualified catering leads against the Phase 11 dashboard line of ~8 at baseline, 65 at Month 6 and 160+ at Month 12, sourced from the CRM and the WhatsApp Business API. Splits demand by the three funded lead engines — corporate enquiries from BKC, Powai and Andheri East, wedding and event RFPs, and house party quotes — and reconciles Campaign 5 instant forms against Google Search form submissions and calls.',
      owners: ['Aditya T.', 'Arjun M.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-11-03',
      end: '2026-09-30',
      expectedOutcome: 'A defensible qualified-lead count by source and by catering engine, so cost per lead can be compared against the ₹230 Meta and ₹450 Google target CPAs.',
      dependencies: ['p5-m6'],
      metrics: {
        cadence: 'Weekly pipeline + monthly review',
        source: 'CRM / WhatsApp Business API'
      },
      tasks: [
        { id: 'p9-m5-t1', name: 'Baseline qualified catering leads at ~8 a month in the CRM pipeline', status: 'completed', due: '2025-11-21', owner: 'Aditya T.' },
        { id: 'p9-m5-t2', name: 'Wire WhatsApp Business API conversations into the CRM lead pipeline', status: 'completed', due: '2025-12-19', owner: 'Rahul K.' },
        { id: 'p9-m5-t3', name: 'Define the qualified-lead standard for corporate, wedding and house party enquiries', status: 'completed', due: '2026-02-27', owner: 'Arjun M.' },
        { id: 'p9-m5-t4', name: 'Report the Month 6 lead position against the 65 qualified-lead milestone', status: 'completed', due: '2026-03-31', owner: 'Aditya T.' },
        { id: 'p9-m5-t5', name: 'Add lead-source splits for Campaign 5 instant forms and Google Search calls', status: 'completed', due: '2026-08-28', owner: 'Aditya T.' },
        { id: 'p9-m5-t6', name: 'Close the CRM stage-history gap on 34 Click-to-WhatsApp conversations', status: 'in-progress', due: '2026-09-15', owner: 'Aditya T.' },
        { id: 'p9-m5-t7', name: 'Produce the Month 12 lead report against the 160+ qualified-lead goal', status: 'in-progress', due: '2026-09-23', owner: 'Arjun M.' }
      ],
      deliverables: [
        { name: 'Qualified-lead definition and CRM stage model for the three catering engines', status: 'Delivered', due: '2026-02-27', owner: 'Arjun M.', dependency: 'Client sales process walkthrough', priority: 'High' },
        { name: 'Monthly catering lead report with source and cost-per-lead splits', status: 'Delivered', due: '2026-08-28', owner: 'Aditya T.', dependency: '—', priority: 'High' },
        { name: 'Month 12 qualified catering lead report (against 160+ goal)', status: 'In Progress', due: '2026-09-23', owner: 'Arjun M.', dependency: 'WhatsApp conversation export from Howrah Ops', priority: 'High' }
      ]
    },
    {
      id: 'p9-m6',
      name: 'ROI Reports',
      summary: 'Owns the commercial half of the Phase 11 sheet: monthly direct meal orders from Direct Checkout and GA4 (baseline < 90, 450 at Month 6, 1,250+ at Month 12), active daily tiffin subscribers from the Subscription Management Database (baseline ~15, 85 at Month 6, 250+ at Month 12) and the Month 12 direct revenue run-rate model — 250 tiffin subscribers at ₹4,500 giving ₹11,25,000 a month, 1,250 à-la-carte orders at ₹650 giving ₹8,12,500, and 25 booked events at ₹45,000 giving ₹11,25,000. The annual board pack consolidating these three streams is scheduled into the final two weeks of Month 12.',
      owners: ['Arjun M.', 'Aditya T.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-11-10',
      end: '2026-09-30',
      expectedOutcome: 'A reconciled ₹30,62,500 monthly direct run-rate at Month 12, evidenced stream by stream and presented to client leadership as the basis for the Year 2 investment case.',
      dependencies: ['p9-m2', 'p9-m4', 'p9-m5'],
      metrics: {
        cadence: 'Monthly close + annual board pack',
        source: 'Direct Checkout / GA4 + Subscription Management Database'
      },
      tasks: [
        { id: 'p9-m6-t1', name: 'Model the Month 12 run-rate at ₹30,62,500 across the three direct revenue streams', status: 'completed', due: '2025-12-12', owner: 'Arjun M.' },
        { id: 'p9-m6-t2', name: 'Publish the Month 6 ROI review against the 450-order and 85-subscriber milestones', status: 'completed', due: '2026-03-31', owner: 'Aditya T.' },
        { id: 'p9-m6-t3', name: 'Quantify aggregator commission saved at 22-28% on direct à-la-carte orders', status: 'completed', due: '2026-06-30', owner: 'Arjun M.' },
        { id: 'p9-m6-t4', name: 'Close the à-la-carte AOV variance between Direct Checkout and GA4 purchase events', status: 'in-progress', due: '2026-09-14', owner: 'Aditya T.' },
        { id: 'p9-m6-t5', name: 'Reconcile tiffin revenue against the ₹11,25,000 monthly subscription run-rate line', status: 'in-progress', due: '2026-09-24', owner: 'Aditya T.' },
        { id: 'p9-m6-t6', name: 'Reconcile catering revenue against 25 booked events at ₹45,000 average ticket', status: 'in-progress', due: '2026-09-26', owner: 'Arjun M.' },
        { id: 'p9-m6-t7', name: 'Assemble the annual board pack on run-rate, CAC and the 12-month KPI record', status: 'not-started', due: '2026-09-29', owner: 'Arjun M.' },
        { id: 'p9-m6-t8', name: 'Present the annual ROI board pack to the Howrah Bridge leadership group', status: 'not-started', due: '2026-09-30', owner: 'Arjun M.' }
      ],
      deliverables: [
        { name: '12-month direct revenue projection model (Month 12 run-rate)', status: 'Delivered', due: '2025-12-12', owner: 'Arjun M.', dependency: 'Audited 1,405-order sales baseline', priority: 'Critical' },
        { name: 'Aggregator commission savings analysis on direct orders', status: 'Delivered', due: '2026-06-30', owner: 'Arjun M.', dependency: 'Swiggy / Zomato payout statements', priority: 'High' },
        { name: 'Month 12 run-rate reconciliation across tiffin, à-la-carte and catering', status: 'In Progress', due: '2026-09-26', owner: 'Aditya T.', dependency: 'Subscription database export from Howrah Ops', priority: 'Critical' },
        { name: 'Annual ROI board pack and Year 2 investment case', status: 'Pending', due: '2026-09-30', owner: 'Arjun M.', dependency: 'Month 12 revenue close and Looker Studio dashboard', priority: 'Critical' }
      ]
    }
  ],
  risks: [
    { id: 'R9.1',
      risk: 'The Looker Studio consolidation joining GA4, Search Console, Google Ads, Meta and the CRM is still in build with under two weeks of programme left, so the ten Phase 11 metrics are still assembled by hand each month.',
      impact: 'High', probability: 'Medium', owner: 'Aditya T.',
      mitigation: 'The manual monthly pack stays the contractual reporting artefact until the dashboard is signed off, and the build is sequenced connector by connector (GA4 and Search Console first, CRM last) so partial automation ships even if the CRM connector slips into Year 2.',
      status: 'Mitigating' },
    { id: 'R9.2',
      risk: 'GA4 purchase events and Direct Checkout order records disagree on à-la-carte volume and AOV, and 5.3% of audited sales still carry no recorded delivery location, so the ₹8,12,500 à-la-carte run-rate line cannot yet be evidenced end to end.',
      impact: 'High', probability: 'Medium', owner: 'Rahul K.',
      mitigation: 'Direct Checkout is treated as the system of record for revenue and GA4 only for attribution, address and postal code capture is now mandatory at checkout and in the WhatsApp CRM, and a documented variance note accompanies every ROI report until the two sources agree within 2%.',
      status: 'Mitigating' },
    { id: 'R9.3',
      risk: 'The Subscription Management Database is maintained by kitchen ops as a manual register, so active tiffin subscriber counts arrive late and unreconciled against billing, putting the ₹11,25,000 monthly subscription line at risk of overstatement.',
      impact: 'High', probability: 'Medium', owner: 'Howrah Ops',
      mitigation: 'Subscriber counts are reconciled against successful billing events rather than register entries, with a weekly Friday cut-off agreed with kitchen ops and a churn column added so the run-rate is reported on active paying subscribers only.',
      status: 'Mitigating' },
    { id: 'R9.4',
      risk: 'Blended paid advertising ROAS is reporting at 3.9x against the 4.2x+ Month 12 goal, and the shortfall lands directly in the annual board pack alongside the run-rate model.',
      impact: 'Medium', probability: 'Medium', owner: 'Karan G.',
      mitigation: 'Reporting separates prospecting spend from retargeting and Performance Max so the 4.5x+ retargeting return is visible against the brand-building spend that dilutes the blend, and the board pack presents ROAS alongside the 22-28% aggregator commission saved on the same orders.',
      status: 'Monitoring' },
    { id: 'R9.5',
      risk: 'WhatsApp Business API conversation exports carry no stage history, so 34 Click-to-WhatsApp conversations sit unqualified in the CRM and the monthly qualified catering lead count can be overstated.',
      impact: 'Medium', probability: 'Medium', owner: 'Aditya T.',
      mitigation: 'Unstaged conversations are held out of the headline qualified-lead figure and reported as a separate pending bucket, with a mandatory disposition field added at the point the kitchen team replies so future months close cleanly.',
      status: 'Open' },
    { id: 'R9.6',
      risk: 'Both remaining phase deliverables — the automated dashboard publish and the annual board pack presentation — are scheduled into the last two weeks of Month 12 with no float before the engagement end date of 30 September 2026.',
      impact: 'High', probability: 'Medium', owner: 'Arjun M.',
      mitigation: 'The board pack is drafted from Month 11 actuals with a single September refresh slot, the leadership presentation is calendar-held for 30 September, and a static PDF export of the dashboard is prepared as a fallback artefact if the Looker Studio publish slips.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Monthly organic website visits', baseline: '1,200', target: '25,000+', current: '21,400', unit: '', direction: 'up' },
    { label: 'Keywords ranking top 3 (Google India)', baseline: '< 5', target: '110+', current: '96', unit: '', direction: 'up' },
    { label: 'Monthly qualified catering leads', baseline: '~8', target: '160+', current: '148', unit: '', direction: 'up' },
    { label: 'Active daily tiffin subscribers', baseline: '~15', target: '250+', current: '218', unit: '', direction: 'up' },
    { label: 'Blended paid advertising ROAS', baseline: '~1.8x', target: '4.2x+', current: '3.9x', unit: '', direction: 'up' },
    { label: 'Phase 11 metrics automated in the consolidated dashboard', baseline: '0', target: '10', current: '7', unit: '/ 10', direction: 'up' }
  ],
  notes: 'Every metric, baseline, Month 6 milestone, Month 12 goal and tracking platform in this phase is taken verbatim from the Phase 11 - KPI Dashboard sheet, including the 12-month direct revenue projection model (250 tiffin subscribers at ₹4,500, 1,250 à-la-carte orders at ₹650, 25 catering events at ₹45,000). Current values are the position at the 15 September 2026 reporting cut and are reported on source-system exports, not platform-reported figures; Direct Checkout is the system of record for revenue and GA4 for attribution. Reporting cadence follows the Phase 10 roadmap, with the mid-year SEO review in Month 6 and the annual technical audit and campaign optimisation review in Month 12.'
});
