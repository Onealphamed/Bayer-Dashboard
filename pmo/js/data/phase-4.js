/* Phase 4 — Local SEO  |  source sheet: "Phase 4 - Local SEO & GBP" */
PMO.registerPhase({
  id: 'p4',
  number: 4,
  name: 'Local SEO',
  subtitle: 'Local pack dominance across 10 geofenced Mumbai postal clusters',
  sourceSheet: 'Phase 4 - Local SEO & GBP',
  objective: 'Convert the Powai kitchen into the default local pack answer for Bengali catering and daily meals across the ten postal clusters it can physically serve. The phase locks the registered NAP entity, fixes Caterer as the primary category — which dictates over 60% of local pack category relevance — and builds the review, media and citation machinery that carries the profile from under 40 reviews to 500+ verified 5-star reviews inside twelve months.',
  expectedOutcome: 'A verified Google Business Profile serving 35,000+ monthly impressions, top-3 local pack placement across the Powai, Andheri and BKC grids, and 500+ verified 5-star reviews backed by 60 NAP-consistent citations and three live hyper-local landing pages.',
  riskLevel: 'Low',
  health: 'green',
  extraColumns: [
    { key: 'impact', label: 'Expected Impact' },
    { key: 'cadence', label: 'Maintenance Cadence' }
  ],
  modules: [
    {
      id: 'p4-m1',
      name: 'Google Business Profile',
      summary: 'Full build and verification of the profile against the Phase 4 optimisation standard: the exact registered entity “Howrah Bridge - Bengali Cloud Kitchen & Catering Services (Powai Hub, Off Saki Vihar Road, Mumbai 400072)”, Caterer as primary category, and Meal Delivery Service, Indian Restaurant, Delivery Restaurant and Restaurant as secondaries.',
      owners: ['Meera S.', 'Priya N.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-01',
      end: '2025-12-19',
      expectedOutcome: 'A verified, category-correct profile that captures adjacent high-intent local searches without keyword-stuffing the registered business name.',
      dependencies: ['p1-m1'],
      metrics: {
        impact: 'Primary category drives 60%+ of local pack relevance',
        cadence: 'Permanent setup; category audit monthly'
      },
      tasks: [
        { id: 'p4-m1-t1', name: 'Lock GBP NAP to the registered Powai Hub entity off Saki Vihar Road, Mumbai 400072', status: 'completed', due: '2025-10-08', owner: 'Meera S.' },
        { id: 'p4-m1-t2', name: 'Set Caterer as the primary category and re-run the local pack relevance benchmark', status: 'completed', due: '2025-10-13', owner: 'Meera S.' },
        { id: 'p4-m1-t3', name: 'Add Meal Delivery Service, Indian Restaurant, Delivery Restaurant and Restaurant', status: 'completed', due: '2025-10-17', owner: 'Meera S.' },
        { id: 'p4-m1-t4', name: 'Build the 6-category catalog: thalis, curries, biryani, chops, sweets, catering', status: 'completed', due: '2025-11-14', owner: 'Priya N.' },
        { id: 'p4-m1-t5', name: 'Tag every catalog item with UTM order links into /menu/ and /catering/ pages', status: 'completed', due: '2025-11-21', owner: 'Aditya T.' },
        { id: 'p4-m1-t6', name: 'Verify hours, FSSAI licence, attributes and the kitchen WhatsApp call button', status: 'completed', due: '2025-11-28', owner: 'Meera S.' },
        { id: 'p4-m1-t7', name: 'Stand up the monthly category audit and the weekly price sync with Howrah Ops', status: 'completed', due: '2025-12-12', owner: 'Howrah Ops' },
        { id: 'p4-m1-t8', name: 'Baseline GBP impressions at ~2,500 per month in Performance Insights', status: 'completed', due: '2025-12-19', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Verified GBP listing with locked NAP and Caterer primary category', status: 'Delivered', due: '2025-10-17', owner: 'Meera S.', dependency: 'Profile owner handover from Howrah Ops', priority: 'Critical' },
        { name: 'Six-category menu catalog with UTM-tagged order deep links', status: 'Delivered', due: '2025-11-21', owner: 'Priya N.', dependency: 'Menu pricing sign-off (Howrah Ops)', priority: 'High' },
        { name: 'GBP governance SOP: monthly category audit, weekly price and item sync', status: 'Delivered', due: '2025-12-19', owner: 'Meera S.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p4-m2',
      name: 'Review Strategy',
      summary: 'The review capture protocol mandated by the Phase 4 sheet: packaging QR cards offering a free Kolkata sweet on the next order, plus an automated WhatsApp review link sent after every catering dispatch, run against the roadmap milestones of 50+ reviews by Month 3, 100+ in festive Month 7, 300+ by Month 10 and 500+ by Month 12.',
      owners: ['Meera S.', 'Howrah Ops'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-11-03',
      end: '2026-09-30',
      expectedOutcome: 'A verified 5-star review base above 500 that overturns the review-count deficit against Bhojohori Manna and unlocks sustained local pack entry.',
      dependencies: ['p4-m1'],
      metrics: {
        impact: '500+ verified 5-star reviews in 12 months',
        cadence: 'Daily post-dispatch; 12-hour response standard'
      },
      tasks: [
        { id: 'p4-m2-t1', name: 'Insert review QR cards offering a free Kolkata sweet on the next order', status: 'completed', due: '2025-11-21', owner: 'Howrah Ops' },
        { id: 'p4-m2-t2', name: 'Automate the post-catering WhatsApp review link on every dispatch confirmation', status: 'completed', due: '2025-11-28', owner: 'Aditya T.' },
        { id: 'p4-m2-t3', name: 'Clear the Month 3 milestone of 50+ verified 5-star Google reviews', status: 'completed', due: '2025-12-31', owner: 'Meera S.' },
        { id: 'p4-m2-t4', name: 'Seed review requests into the 70 active regulars and 15 mega-loyalist cohorts', status: 'completed', due: '2026-02-27', owner: 'Aditya T.' },
        { id: 'p4-m2-t5', name: 'Pass 100+ reviews through the festive Month 7 push under 12-hour response cover', status: 'completed', due: '2026-04-30', owner: 'Meera S.' },
        { id: 'p4-m2-t6', name: 'Surpass 300+ cumulative reviews ahead of the Month 10 monsoon catering peak', status: 'completed', due: '2026-07-31', owner: 'Meera S.' },
        { id: 'p4-m2-t7', name: 'Clear the September reply backlog to restore the 12-hour response standard', status: 'in-progress', due: '2026-09-12', owner: 'Meera S.' },
        { id: 'p4-m2-t8', name: 'Close the 500+ review milestone across the Powai, Andheri East and BKC clusters', status: 'in-progress', due: '2026-09-30', owner: 'Meera S.' }
      ],
      deliverables: [
        { name: 'Review capture protocol: QR insert cards and post-dispatch WhatsApp links', status: 'Delivered', due: '2025-11-28', owner: 'Meera S.', dependency: 'Packaging print run (Howrah Ops)', priority: 'Critical' },
        { name: 'Milestone tracker against 50 / 100 / 300 / 500 verified reviews', status: 'In Review', due: '2026-09-30', owner: 'Meera S.', dependency: 'GBP Performance Insights export', priority: 'High' },
        { name: 'Owner response playbook with 12-hour SLA and escalation ladder', status: 'In Progress', due: '2026-09-26', owner: 'Meera S.', dependency: 'Kitchen duty roster', priority: 'Medium' }
      ]
    },
    {
      id: 'p4-m3',
      name: 'Local Citations',
      summary: 'Tier 4 hyper-local citation programme against the Phase 9 target of 60 annual links at 15 clean citations per quarter — Justdial Mumbai, Sulekha, IndiaMART, Magicpin, TradeIndia and the Bombay Chamber — all carrying 100% NAP-consistent detail and full catering service category tagging.',
      owners: ['Meera S.', 'Nikhil C.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-06',
      end: '2026-06-19',
      expectedOutcome: 'A clean, duplicate-free citation footprint of DR 25–45 listings that stabilises entity trust and feeds local pack proximity signals.',
      dependencies: ['p4-m1'],
      metrics: {
        impact: '60 NAP-consistent citations, DR 25–45',
        cadence: '15 clean citations per quarter'
      },
      tasks: [
        { id: 'p4-m3-t1', name: 'Lock a single source-of-truth NAP record for the Powai Hub, Mumbai 400072', status: 'completed', due: '2025-10-10', owner: 'Meera S.' },
        { id: 'p4-m3-t2', name: 'Build the first 20 Tier-1 local citations from the master NAP record', status: 'completed', due: '2025-10-31', owner: 'Meera S.' },
        { id: 'p4-m3-t3', name: 'Publish NAP-consistent listings on Justdial Mumbai, Sulekha and Magicpin', status: 'completed', due: '2025-12-19', owner: 'Meera S.' },
        { id: 'p4-m3-t4', name: 'Create WedMeGood, WeddingWire India and ShaadiSaga vendor profiles', status: 'completed', due: '2026-01-30', owner: 'Nikhil C.' },
        { id: 'p4-m3-t5', name: 'Add IndiaMART, TradeIndia and Bombay Chamber catering-category citations', status: 'completed', due: '2026-02-27', owner: 'Nikhil C.' },
        { id: 'p4-m3-t6', name: 'Run a duplicate and NAP-variance sweep across every live citation', status: 'completed', due: '2026-04-17', owner: 'Meera S.' },
        { id: 'p4-m3-t7', name: 'Hold the 15 clean citations per quarter run rate through Q1 to Q3', status: 'completed', due: '2026-06-19', owner: 'Meera S.' }
      ],
      deliverables: [
        { name: 'Master NAP record and citation submission tracker (60 annual target)', status: 'Delivered', due: '2025-10-10', owner: 'Meera S.', dependency: '—', priority: 'High' },
        { name: 'Tier 4 hyper-local citation set: 55 live NAP-consistent listings', status: 'Delivered', due: '2026-06-19', owner: 'Meera S.', dependency: 'FSSAI licence copy (Howrah Ops)', priority: 'High' },
        { name: 'Citation variance and duplicate suppression report', status: 'Delivered', due: '2026-04-17', owner: 'Nikhil C.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p4-m4',
      name: 'Maps Optimization',
      summary: 'Explicit service-area polygon mapping across the ten geofenced postal clusters — Powai 400076, Andheri East 400069, Andheri West 400053, Sakinaka 400072, Marol 400059, Chandivali 400072, BKC 400051, Bandra 400050, Vikhroli 400079 and Kanjurmarg 400078 — sustained by 5 geo-tagged photo uploads every Monday covering raw prep, kitchen hygiene, packaging boxes and live buffets.',
      owners: ['Meera S.', 'Riya S.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-10-15',
      end: '2026-09-30',
      expectedOutcome: 'Top-3 local pack placement across the served clusters, with the visual media cadence delivering the benchmarked +42% directions requests and +35% calls.',
      dependencies: ['p4-m1'],
      metrics: {
        impact: '+42% directions requests, +35% calls',
        cadence: 'Weekly Monday uploads; quarterly area expansion'
      },
      tasks: [
        { id: 'p4-m4-t1', name: 'Map explicit service-area polygons across the 10 geofenced postal clusters', status: 'completed', due: '2025-10-31', owner: 'Meera S.' },
        { id: 'p4-m4-t2', name: 'Verify PIN coverage for Powai 400076, Andheri East 400069 and BKC 400051', status: 'completed', due: '2025-11-14', owner: 'Meera S.' },
        { id: 'p4-m4-t3', name: 'Start the Monday cadence of 5 geo-tagged photo uploads from the Powai kitchen', status: 'completed', due: '2025-11-24', owner: 'Howrah Ops' },
        { id: 'p4-m4-t4', name: 'Shoot raw prep, hygiene, packaging and live buffet sets for the weekly rotation', status: 'completed', due: '2026-01-30', owner: 'Riya S.' },
        { id: 'p4-m4-t5', name: 'Instrument directions and call events against the +42% / +35% media benchmark', status: 'completed', due: '2026-03-31', owner: 'Aditya T.' },
        { id: 'p4-m4-t6', name: 'Broaden the delivery radius through Goregaon to Malad West without breaking SLA', status: 'in-progress', due: '2026-08-31', owner: 'Meera S.' },
        { id: 'p4-m4-t7', name: 'Secure top-3 local pack placement across all 10 clusters before Month 12 close', status: 'in-progress', due: '2026-09-30', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Geofenced service-area polygon map covering 10 postal clusters', status: 'Delivered', due: '2025-10-31', owner: 'Meera S.', dependency: 'Dispatch radius sign-off (Howrah Ops)', priority: 'Critical' },
        { name: 'Weekly geo-tagged media bank (5 uploads every Monday)', status: 'In Progress', due: '2026-09-28', owner: 'Riya S.', dependency: 'Kitchen shoot access', priority: 'High' },
        { name: 'Local pack rank grid across Powai, Andheri, BKC and Vikhroli', status: 'In Review', due: '2026-09-30', owner: 'Sohini B.', dependency: 'Rank-grid tooling licence', priority: 'High' },
        { name: 'Western suburb radius expansion case (Goregaon to Malad West)', status: 'In Progress', due: '2026-09-25', owner: 'Meera S.', dependency: 'Dispatch capacity model', priority: 'Medium' }
      ]
    },
    {
      id: 'p4-m5',
      name: 'Location Pages',
      summary: 'Hyper-local landing pages built on the Phase 3 geo-intent cluster: catering services powai (KD 19%, 950/mo), catering services andheri east (KD 22%, 1,200/mo), catering services bkc (KD 20%, 1,050/mo) and best tiffin service in powai (KD 18%, 1,100/mo), each carrying map pins, live review badges and Mumbai-geocoded structured data.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2026-01-05',
      end: '2026-04-24',
      expectedOutcome: 'Three ranking location hubs that convert geo-intent searches into direct catering enquiries without paying aggregator commission.',
      dependencies: ['p1-m1', 'p4-m4'],
      metrics: {
        impact: '4,300 combined monthly searches at KD 18–22%',
        cadence: 'Quarterly content and pricing refresh'
      },
      tasks: [
        { id: 'p4-m5-t1', name: 'Publish /locations/powai/ against catering services powai (KD 19%, 950/mo)', status: 'completed', due: '2026-01-23', owner: 'Priya N.' },
        { id: 'p4-m5-t2', name: 'Publish /locations/andheri-east/ for catering services andheri east (1,200/mo)', status: 'completed', due: '2026-01-30', owner: 'Priya N.' },
        { id: 'p4-m5-t3', name: 'Publish /locations/bkc/ for catering services bkc (KD 20%, 1,050/mo)', status: 'completed', due: '2026-02-06', owner: 'Priya N.' },
        { id: 'p4-m5-t4', name: 'Fold best tiffin service in powai (KD 18%, 1,100/mo) into the Powai hub page', status: 'completed', due: '2026-02-20', owner: 'Sohini B.' },
        { id: 'p4-m5-t5', name: 'Embed GBP review badges, map pins and 400076 / 400069 / 400051 PIN copy', status: 'completed', due: '2026-03-13', owner: 'Vikram D.' },
        { id: 'p4-m5-t6', name: 'Add LocalBusiness and CateringService JSON-LD with Mumbai geocodes per page', status: 'completed', due: '2026-03-27', owner: 'Rahul K.' },
        { id: 'p4-m5-t7', name: 'Cross-link Emerald Isle, Godrej Platinum and Lake Homes proof into each page', status: 'completed', due: '2026-04-24', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Hyper-local landing pages for Powai, Andheri East and BKC', status: 'Delivered', due: '2026-02-06', owner: 'Priya N.', dependency: 'URL silo blueprint (p1-m1)', priority: 'Critical' },
        { name: 'LocalBusiness and CateringService JSON-LD templates with Mumbai geocodes', status: 'Delivered', due: '2026-03-27', owner: 'Rahul K.', dependency: 'Schema library from Phase 1', priority: 'High' },
        { name: 'Society-level proof module (Emerald Isle, Godrej Platinum, Lake Homes)', status: 'Delivered', due: '2026-04-24', owner: 'Riya S.', dependency: 'Client consent on society names', priority: 'Medium' }
      ]
    },
    {
      id: 'p4-m6',
      name: 'Local Link Building',
      summary: 'Locally anchored authority acquisition running alongside the citation base: DR 55–85 lifestyle features with LBB Mumbai, Curly Tales, Mumbai Live and Times Food, society and cultural association partnerships in Powai and Vikhroli, and DR 45–70 wedding vendor placements on WedMeGood and WeddingWire India.',
      owners: ['Nikhil C.', 'Meera S.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2026-02-02',
      end: '2026-09-30',
      expectedOutcome: 'Locally relevant editorial and partnership links that lift entity authority behind the location pages and the Month 12 top-3 local pack push.',
      dependencies: ['p4-m3', 'p4-m5'],
      metrics: {
        impact: 'DR 55–85 editorial plus DR 45–70 vendor links',
        cadence: '3 editorial features per quarter'
      },
      tasks: [
        { id: 'p4-m6-t1', name: 'Pitch LBB Mumbai and Curly Tales on the Powai heritage kitchen editorial angle', status: 'completed', due: '2026-03-06', owner: 'Nikhil C.' },
        { id: 'p4-m6-t2', name: 'Land the first two DR 55+ lifestyle features from the Month 5 outreach wave', status: 'completed', due: '2026-03-31', owner: 'Nikhil C.' },
        { id: 'p4-m6-t3', name: 'Partner with Mumbai Bengali cultural associations and society committees', status: 'completed', due: '2026-04-30', owner: 'Nikhil C.' },
        { id: 'p4-m6-t4', name: 'Secure wedding vendor backlinks from WedMeGood and WeddingWire India profiles', status: 'completed', due: '2026-06-30', owner: 'Nikhil C.' },
        { id: 'p4-m6-t5', name: 'Place B2B thought-leadership links on People Matters and HR Katha (DR 30–50)', status: 'in-progress', due: '2026-09-25', owner: 'Nikhil C.' },
        { id: 'p4-m6-t6', name: 'Publish local holiday catering guides for Mumbai Live and Times Food pickup', status: 'in-progress', due: '2026-09-28', owner: 'Priya N.' },
        { id: 'p4-m6-t7', name: 'Close the Q4 tranche of 15 clean Tier 4 directory citations', status: 'in-progress', due: '2026-09-30', owner: 'Meera S.' },
        { id: 'p4-m6-t8', name: 'Brief the Bombay Chamber corporate catering listing for the Month 12 handover', status: 'not-started', due: '2026-09-29', owner: 'Nikhil C.' }
      ],
      deliverables: [
        { name: 'Local editorial coverage set: LBB Mumbai, Curly Tales, Mumbai Live', status: 'Delivered', due: '2026-03-31', owner: 'Nikhil C.', dependency: 'Founder interview slot', priority: 'High' },
        { name: 'Society and cultural association partnership register', status: 'Delivered', due: '2026-04-30', owner: 'Nikhil C.', dependency: 'Committee introductions (Howrah Ops)', priority: 'Medium' },
        { name: 'Wedding vendor link portfolio (WedMeGood, WeddingWire, ShaadiSaga)', status: 'Delivered', due: '2026-06-30', owner: 'Nikhil C.', dependency: 'Per-plate pricing sheets', priority: 'High' },
        { name: 'Q4 local link and citation tranche with DR distribution report', status: 'In Progress', due: '2026-09-30', owner: 'Nikhil C.', dependency: 'Editor response windows', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R4.1',
      risk: 'Sakinaka (400072) and Chandivali (400072) share the Powai Hub postal code, creating ambiguous service-area signals and a duplicate-listing exposure on Google Maps.',
      impact: 'Medium', probability: 'Medium', owner: 'Meera S.',
      mitigation: 'Single source-of-truth NAP record enforced across all 60 citations; polygons drawn on locality boundaries rather than PIN codes, with a quarterly duplicate sweep.',
      status: 'Monitoring' },
    { id: 'R4.2',
      risk: 'The packaging QR card offer of a free Kolkata sweet on the next order can read as incentivised review solicitation and trigger Google review filtering.',
      impact: 'High', probability: 'Low', owner: 'Meera S.',
      mitigation: 'Card copy rewritten to decouple the sweet from any rating condition; the post-catering WhatsApp link carries neutral wording and now drives the majority of review volume.',
      status: 'Mitigating' },
    { id: 'R4.3',
      risk: 'Bhojohori Manna holds an entrenched Powai profile at 4.1 stars with 1,200+ reviews, suppressing local pack entry while the review base builds from under 40.',
      impact: 'Medium', probability: 'Medium', owner: 'Sohini B.',
      mitigation: 'Compete on recency and rating rather than volume; sustained 5-star velocity plus the weekly geo-tagged media cadence lifted 8 of 10 clusters into the top 3.',
      status: 'Monitoring' },
    { id: 'R4.4',
      risk: 'The Monday cadence of 5 geo-tagged uploads depends on kitchen floor access; missed weeks erode the benchmarked +42% directions and +35% calls uplift.',
      impact: 'Medium', probability: 'Medium', owner: 'Riya S.',
      mitigation: 'Four-week rolling media bank held in reserve and refreshed on every shoot day, so uploads continue through festive and monsoon production peaks.',
      status: 'Mitigating' },
    { id: 'R4.5',
      risk: 'Broadening the GBP delivery radius from Goregaon through Malad West in Month 11 risks dispatch times that generate the first negative reviews of the programme.',
      impact: 'High', probability: 'Low', owner: 'Meera S.',
      mitigation: 'Expansion gated on a dispatch capacity model and limited to scheduled weekend bulk orders, mirroring the existing Malad West and Wadala order pattern.',
      status: 'Open' },
    { id: 'R4.6',
      risk: 'Kitchen price changes drift between the GBP catalog, the website menu and the JSON-LD feed, exposing the profile to a suspended product catalog.',
      impact: 'Medium', probability: 'Medium', owner: 'Howrah Ops',
      mitigation: 'Weekly price and item sync formalised in the GBP governance SOP, with a monthly category audit reconciling catalog, site and schema in one pass.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Total verified 5-star Google reviews', baseline: '< 40', target: '500+', current: '486', unit: '', direction: 'up' },
    { label: 'GBP views / impressions per month', baseline: '~2,500', target: '35,000+', current: '33,400', unit: '', direction: 'up' },
    { label: 'Local pack top-3 placements across 10 clusters', baseline: '0', target: '10', current: '8', unit: '', direction: 'up' },
    { label: 'Maps directions requests uplift from visual media', baseline: 'Flat', target: '+42%', current: '+40%', unit: '', direction: 'up' },
    { label: 'Calls from profile uplift from visual media', baseline: 'Flat', target: '+35%', current: '+33%', unit: '', direction: 'up' },
    { label: 'NAP-consistent hyper-local citations live', baseline: '0', target: '60 / yr', current: '55', unit: '', direction: 'up' }
  ],
  notes: 'Profile standards, categories, service-area clusters and the review protocol are taken verbatim from the Phase 4 sheet; milestone timing (50+ by Month 3, 100+ in festive Month 7, 300+ by Month 10, 500+ by Month 12) follows the Phase 10 roadmap, and KPI baselines and targets follow the Phase 11 dashboard. Current values were read from GBP Performance Insights on 15 Sep 2026.'
});
