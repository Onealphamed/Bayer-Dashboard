/* Phase 2 — SEO Implementation  |  source sheet: "Phase 3 - SEO Master Plan" */
PMO.registerPhase({
  id: 'p2',
  number: 2,
  name: 'SEO Implementation',
  subtitle: '27 mapped keywords, 55,350 monthly searches, 18 canonical URLs, five intent clusters',
  sourceSheet: 'Phase 3 - SEO Master Plan',
  objective: 'Convert the Phase 1 architectural findings into a ranked, revenue-weighted organic footprint: 27 audited keywords worth 55,350 monthly searches, mapped to 18 canonical URLs across the menu, catering, daily-meals, festival and location silos. The phase front-loads the 16 Critical-priority terms that feed the three direct revenue streams — tiffin subscriptions, a-la-carte delivery and event catering — ahead of high-difficulty brand head terms held by Bhojohori Manna (DR 42+). Success is measured in ranked money pages and qualified enquiries, not in aggregate sessions.',
  expectedOutcome: 'Top-10 visibility on 271 tracked terms and top-3 on 96, lifting monthly organic sessions from 1,200 to 21,400 and qualified catering leads from roughly 8 to 138 per month.',
  riskLevel: 'Medium',
  health: 'green',
  extraColumns: [{key:'keywords',label:'Keywords In Scope'},{key:'volume',label:'Monthly Volume'}],
  notes: 'Cluster volumes are the audited SEMrush India figures from the Phase 3 master plan: Bengali Food Mumbai 28,650 (12 terms), Corporate Catering Mumbai 4,700 (4), Wedding & Event Catering 9,700 (4), Daily Meals & Tiffins 9,100 (4), Hyper-Local Hubs 3,200 (3). Module volumes are the sum of the terms mapped to that module and may overlap where a page is both optimised and refreshed.',

  modules: [
    {
      id: 'p2-m1',
      name: 'Keyword Research',
      summary: 'Build and validate the 27-term target universe across the five clusters defined in the Phase 3 master plan, with audited KD percentages and India-market monthly volumes.',
      owners: ['Sohini B.', 'Priya N.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-10',
      end: '2025-11-07',
      expectedOutcome: 'A ranked, difficulty-scored keyword universe that directs every downstream page, meta and content decision in the phase.',
      dependencies: [],
      metrics: { keywords: 27, volume: '55,350' },
      tasks: [
        { id: 'p2-m1-t1', name: 'Build the 27-term seed universe across the five Phase 3 clusters from Ahrefs and GSC', status: 'completed', due: '2025-10-17', owner: 'Sohini B.' },
        { id: 'p2-m1-t2', name: 'Validate KD percentage and monthly volume for all 27 terms in the SEMrush India index', status: 'completed', due: '2025-10-22', owner: 'Sohini B.' },
        { id: 'p2-m1-t3', name: 'Benchmark Bhojohori Manna (DR 42+) and Oh! Calcutta SERP share on the eight head terms', status: 'completed', due: '2025-10-27', owner: 'Sohini B.' },
        { id: 'p2-m1-t4', name: 'Size the seasonal surge terms: durga puja food delivery (5,200) and poila baisakh (2,400)', status: 'completed', due: '2025-10-30', owner: 'Priya N.' },
        { id: 'p2-m1-t5', name: 'Score Box8 and Rebel Foods programmatic overlap on tiffin service mumbai (KD 38%, 4,500)', status: 'completed', due: '2025-11-03', owner: 'Sohini B.' },
        { id: 'p2-m1-t6', name: 'Sign off the priority split of 16 Critical versus 11 High terms with the Engagement Director', status: 'completed', due: '2025-11-07', owner: 'Arjun M.' }
      ],
      deliverables: [
        { name: 'Keyword universe workbook — 27 terms with KD %, volume, intent and cluster', status: 'Delivered', due: '2025-10-22', owner: 'Sohini B.', dependency: 'Ahrefs and GSC property access', priority: 'Critical' },
        { name: 'Competitive SERP share benchmark vs Bhojohori Manna, Hangla and Box8', status: 'Delivered', due: '2025-10-27', owner: 'Sohini B.', dependency: '—', priority: 'High' },
        { name: 'Cluster prioritisation memo (16 Critical / 11 High) with revenue weighting', status: 'Delivered', due: '2025-11-07', owner: 'Arjun M.', dependency: 'Client menu and catering roadmap', priority: 'High' }
      ]
    },

    {
      id: 'p2-m2',
      name: 'Keyword Mapping',
      summary: 'Assign every one of the 27 target terms to a single canonical URL across the 18-page architecture, eliminating the flat hierarchy and cannibalisation flagged in the Phase 1 audit.',
      owners: ['Sohini B.', 'Rahul K.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-11-03',
      end: '2025-11-28',
      expectedOutcome: 'One term, one owning page — a frozen keyword-to-URL map that prevents two pages competing for the same query.',
      dependencies: ['p2-m1'],
      metrics: { keywords: 27, volume: '55,350' },
      tasks: [
        { id: 'p2-m2-t1', name: 'Map all 27 terms to 18 canonical URLs across /menu/, /catering/, /daily-meals/ and /locations/', status: 'completed', due: '2025-11-12', owner: 'Sohini B.' },
        { id: 'p2-m2-t2', name: 'Resolve dual-term overlap on /menu/fish-curries/ and /catering/party-catering-mumbai/', status: 'completed', due: '2025-11-17', owner: 'Sohini B.' },
        { id: 'p2-m2-t3', name: 'Define silo parents to close the flat URL hierarchy finding from the Phase 1 audit', status: 'completed', due: '2025-11-20', owner: 'Rahul K.' },
        { id: 'p2-m2-t4', name: 'Lock 301 rules and self-referencing canonical tags across the 18 mapped URLs', status: 'completed', due: '2025-11-24', owner: 'Rahul K.' },
        { id: 'p2-m2-t5', name: 'Publish the keyword-to-URL map to the client workspace and freeze version 1', status: 'completed', due: '2025-11-28', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Keyword-to-URL map v1 — 27 terms against 18 canonical destinations', status: 'Delivered', due: '2025-11-12', owner: 'Sohini B.', dependency: 'Keyword universe workbook', priority: 'Critical' },
        { name: 'Silo architecture blueprint (/menu/, /catering/, /daily-meals/, /festivals/, /locations/)', status: 'Delivered', due: '2025-11-20', owner: 'Rahul K.', dependency: 'Client CMS route access', priority: 'Critical' },
        { name: 'Canonical and redirect ruleset signed off by the client dev team', status: 'Delivered', due: '2025-11-28', owner: 'Rahul K.', dependency: 'Staging deploy window', priority: 'High' }
      ]
    },

    {
      id: 'p2-m3',
      name: 'Meta Optimization',
      summary: 'Write and deploy title tags, meta descriptions and H1s for the 18 mapped URLs, each carrying its primary term plus a Mumbai or Powai geo modifier and a WhatsApp order call to action.',
      owners: ['Sohini B.', 'Priya N.'],
      priority: 'High',
      status: 'completed',
      start: '2025-11-24',
      end: '2026-01-23',
      expectedOutcome: 'Higher SERP click-through on already-impressed queries without waiting for rank movement.',
      dependencies: ['p2-m2'],
      metrics: { keywords: 27, volume: '55,350' },
      tasks: [
        { id: 'p2-m3-t1', name: 'Draft 18 title tags under 60 characters with primary term plus Mumbai or Powai modifier', status: 'completed', due: '2025-12-05', owner: 'Priya N.' },
        { id: 'p2-m3-t2', name: 'Draft 18 meta descriptions under 155 characters with a WhatsApp order call to action', status: 'completed', due: '2025-12-12', owner: 'Priya N.' },
        { id: 'p2-m3-t3', name: 'Rewrite H1s on the eight /menu/ dish pages to lead with the mapped transactional term', status: 'completed', due: '2025-12-19', owner: 'Priya N.' },
        { id: 'p2-m3-t4', name: 'Deploy metas to the CMS and verify rendering in the mobile SERP preview', status: 'completed', due: '2026-01-06', owner: 'Vikram D.' },
        { id: 'p2-m3-t5', name: 'Set Open Graph and Twitter card metas on the catering and festival templates', status: 'completed', due: '2026-01-13', owner: 'Vikram D.' },
        { id: 'p2-m3-t6', name: 'Resubmit sitemap-menu.xml and sitemap-catering.xml with lastmod timestamps', status: 'completed', due: '2026-01-19', owner: 'Rahul K.' },
        { id: 'p2-m3-t7', name: 'Benchmark GSC click-through uplift across the 18 URLs against the pre-deploy baseline', status: 'completed', due: '2026-01-23', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Title and meta description set for 18 canonical URLs', status: 'Delivered', due: '2025-12-12', owner: 'Priya N.', dependency: 'Keyword-to-URL map v1', priority: 'High' },
        { name: 'Split XML sitemap index (pages, menu, catering) with lastmod tags', status: 'Delivered', due: '2026-01-19', owner: 'Rahul K.', dependency: 'CMS sitemap plugin access', priority: 'Medium' },
        { name: 'Pre and post deploy CTR benchmark report (GSC, 18 URLs)', status: 'Delivered', due: '2026-01-23', owner: 'Sohini B.', dependency: '—', priority: 'Medium' }
      ]
    },

    {
      id: 'p2-m4',
      name: 'Internal Linking',
      summary: 'Build a contextual linking mesh that routes authority from the published blog set and category hubs into the 16 Critical-priority money pages, closing the Phase 1 finding of zero cross-linking to catering packages.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2026-02-02',
      end: '2026-04-30',
      expectedOutcome: 'Every high-ticket catering and tiffin page reachable within three clicks and fed by keyword-rich contextual links.',
      dependencies: ['p2-m2', 'p2-m6'],
      metrics: { keywords: 16, volume: '33,100' },
      tasks: [
        { id: 'p2-m4-t1', name: 'Crawl the site in Screaming Frog and map orphan pages across the 16 Critical money URLs', status: 'completed', due: '2026-02-10', owner: 'Rahul K.' },
        { id: 'p2-m4-t2', name: 'Insert contextual links from the published blog set into the 16 Critical money pages', status: 'completed', due: '2026-02-20', owner: 'Priya N.' },
        { id: 'p2-m4-t3', name: 'Build the hub-and-spoke mesh from /menu/bengali-food-delivery/ to eight dish pages', status: 'completed', due: '2026-03-06', owner: 'Priya N.' },
        { id: 'p2-m4-t4', name: 'Add Basanti Pulao and Kosha Mangsho combo cross-links on both paired dish pages', status: 'completed', due: '2026-03-20', owner: 'Priya N.' },
        { id: 'p2-m4-t5', name: 'Enforce three-click depth to every money page and cap outbound links per template', status: 'completed', due: '2026-04-10', owner: 'Rahul K.' },
        { id: 'p2-m4-t6', name: 'Recrawl to confirm zero orphans and internal authority lift across the catering silo', status: 'completed', due: '2026-04-30', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Internal link architecture map (hub, spoke and blog-to-money-page routes)', status: 'Delivered', due: '2026-02-20', owner: 'Priya N.', dependency: 'Published blog inventory', priority: 'High' },
        { name: 'Anchor text matrix for the 16 Critical-priority destinations', status: 'Delivered', due: '2026-03-20', owner: 'Sohini B.', dependency: 'Keyword-to-URL map v1', priority: 'Medium' },
        { name: 'Post-implementation crawl report: zero orphans, depth <= 3', status: 'Delivered', due: '2026-04-30', owner: 'Rahul K.', dependency: '—', priority: 'Medium' }
      ]
    },

    {
      id: 'p2-m5',
      name: 'Schema Implementation',
      summary: 'Inject the JSON-LD structured data the Phase 1 audit found entirely absent: Restaurant, FoodEstablishment, Menu, MenuItem, CateringService, FAQPage and Event markup across the full 18-URL architecture.',
      owners: ['Rahul K.', 'Vikram D.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-12-01',
      end: '2026-02-13',
      expectedOutcome: 'Rich result eligibility on menu pricing, catering services, FAQs and festival pre-booking, lifting SERP real estate against aggregator listings.',
      dependencies: ['p2-m2', 'p1-m1'],
      metrics: { keywords: 27, volume: '55,350' },
      tasks: [
        { id: 'p2-m5-t1', name: 'Inject Restaurant and FoodEstablishment JSON-LD with Mumbai service-area geocodes', status: 'completed', due: '2025-12-10', owner: 'Rahul K.' },
        { id: 'p2-m5-t2', name: 'Deploy Menu and MenuItem schema with pricing across the six core menu categories', status: 'completed', due: '2025-12-19', owner: 'Vikram D.' },
        { id: 'p2-m5-t3', name: 'Add CateringService schema to the four /catering/ templates', status: 'completed', due: '2026-01-09', owner: 'Vikram D.' },
        { id: 'p2-m5-t4', name: 'Add FAQPage schema to the tiffin, corporate and wedding catering landing pages', status: 'completed', due: '2026-01-23', owner: 'Priya N.' },
        { id: 'p2-m5-t5', name: 'Publish Event schema on the Durga Puja and Poila Baisakh pre-booking pages', status: 'completed', due: '2026-02-04', owner: 'Vikram D.' },
        { id: 'p2-m5-t6', name: 'Clear all Rich Results and Search Console structured-data errors on the 18 URLs', status: 'completed', due: '2026-02-13', owner: 'Rahul K.' }
      ],
      deliverables: [
        { name: 'JSON-LD schema pack (Restaurant, Menu, MenuItem, CateringService, FAQPage, Event)', status: 'Delivered', due: '2026-01-23', owner: 'Rahul K.', dependency: 'Client staging access', priority: 'Critical' },
        { name: 'Menu pricing feed for MenuItem markup across six categories', status: 'Delivered', due: '2025-12-19', owner: 'Howrah Ops', dependency: 'Kitchen price list sign-off', priority: 'High' },
        { name: 'Structured data validation report — zero errors on 18 URLs', status: 'Delivered', due: '2026-02-13', owner: 'Rahul K.', dependency: '—', priority: 'High' }
      ]
    },

    {
      id: 'p2-m6',
      name: 'Page Optimization',
      summary: 'Rebuild the seven dish-level product pages carrying transactional intent — Kosha Mangsho, Basanti Pulao, Bhetki Fish Fry, Machher Jhol, Posto Chicken, Chingri Malaikari and Shorshe Ilish — into order-ready pages.',
      owners: ['Sohini B.', 'Vikram D.'],
      priority: 'High',
      status: 'completed',
      start: '2025-12-08',
      end: '2026-03-27',
      expectedOutcome: 'Direct website orders converted from dish-level search rather than lost to Swiggy and Zomato listings.',
      dependencies: ['p2-m3', 'p2-m5'],
      metrics: { keywords: 7, volume: '10,150' },
      tasks: [
        { id: 'p2-m6-t1', name: 'Expand /menu/kosha-mangsho/ and /menu/basanti-pulao/ to 900-plus words each', status: 'completed', due: '2025-12-18', owner: 'Priya N.' },
        { id: 'p2-m6-t2', name: 'Rebuild /menu/fish-fry/ around Bhetki Fish Fry: 368 portions, 92% repeat buyers', status: 'completed', due: '2025-12-29', owner: 'Priya N.' },
        { id: 'p2-m6-t3', name: 'Optimise /menu/fish-curries/ for machher jhol and chingri malaikari dual intent', status: 'completed', due: '2026-01-15', owner: 'Sohini B.' },
        { id: 'p2-m6-t4', name: 'Rewrite /menu/hilsa-specials/ for shorshe ilish delivery mumbai (KD 31%, 2,200)', status: 'completed', due: '2026-01-30', owner: 'Priya N.' },
        { id: 'p2-m6-t5', name: 'Optimise /menu/chicken-mains/ around the Posto Chicken 100% repeat hook', status: 'completed', due: '2026-02-17', owner: 'Priya N.' },
        { id: 'p2-m6-t6', name: 'Add the one-click WhatsApp order bar to all six dish templates at 48px touch targets', status: 'completed', due: '2026-03-10', owner: 'Vikram D.' },
        { id: 'p2-m6-t7', name: 'Ship WebP swaps and keyword-aligned alt text on 40 dish photos across six pages', status: 'completed', due: '2026-03-27', owner: 'Vikram D.' }
      ],
      deliverables: [
        { name: 'Seven optimised dish pages with pricing, provenance copy and order CTAs', status: 'Delivered', due: '2026-02-17', owner: 'Priya N.', dependency: 'Kitchen photography bank', priority: 'High' },
        { name: 'WhatsApp one-click order component on the /menu/ template', status: 'Delivered', due: '2026-03-10', owner: 'Vikram D.', dependency: 'WhatsApp Business API number', priority: 'Critical' },
        { name: 'Dish page image optimisation set (40 assets, WebP plus alt text)', status: 'Delivered', due: '2026-03-27', owner: 'Riya S.', dependency: 'Phase 1 WebP pipeline', priority: 'Medium' }
      ]
    },

    {
      id: 'p2-m7',
      name: 'Category Optimization',
      summary: 'Turn the three category hubs — /menu/bengali-food-delivery/, /menu/kolkata-biryani/ and /catering/bengali-catering-mumbai/ — into authority pages capable of contesting the DR 42+ incumbent head terms.',
      owners: ['Sohini B.', 'Priya N.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2026-03-02',
      end: '2026-06-30',
      expectedOutcome: 'Category-level rankings on the two highest-volume commercial terms, worth 8,000 monthly searches combined.',
      dependencies: ['p2-m6'],
      metrics: { keywords: 4, volume: '12,300' },
      tasks: [
        { id: 'p2-m7-t1', name: 'Rebuild /menu/bengali-food-delivery/ as the cluster hub for 8,000 combined volume', status: 'completed', due: '2026-03-20', owner: 'Sohini B.' },
        { id: 'p2-m7-t2', name: 'Optimise /menu/kolkata-biryani/ for kolkata biryani delivery mumbai (KD 28%, 2,900)', status: 'completed', due: '2026-04-10', owner: 'Priya N.' },
        { id: 'p2-m7-t3', name: 'Add faceted category navigation and BreadcrumbList schema to both menu hubs', status: 'completed', due: '2026-05-08', owner: 'Vikram D.' },
        { id: 'p2-m7-t4', name: 'Launch /catering/bengali-catering-mumbai/ for bengali wedding caterers mumbai (1,400)', status: 'in-progress', due: '2026-06-05', owner: 'Priya N.' },
        { id: 'p2-m7-t5', name: 'Contest best bengali restaurant mumbai (KD 42%, 4,400) held by Bhojohori Manna', status: 'in-progress', due: '2026-06-22', owner: 'Sohini B.' },
        { id: 'p2-m7-t6', name: 'Publish mid-market comparison copy against the Oh! Calcutta ₹1,800-per-head position', status: 'not-started', due: '2026-09-25', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'Two rebuilt menu category hubs with faceted navigation and breadcrumbs', status: 'Delivered', due: '2026-05-08', owner: 'Sohini B.', dependency: 'Dish page rebuild complete', priority: 'High' },
        { name: 'Bengali catering category hub (/catering/bengali-catering-mumbai/)', status: 'In Review', due: '2026-06-05', owner: 'Priya N.', dependency: 'Wedding client testimonial set', priority: 'Medium' },
        { name: 'Head-term displacement plan for best bengali restaurant mumbai', status: 'In Progress', due: '2026-06-22', owner: 'Sohini B.', dependency: 'Phase 9 link acquisition', priority: 'Medium' }
      ]
    },

    {
      id: 'p2-m8',
      name: 'Landing Pages',
      summary: 'Build the six commercial landing pages carrying the highest revenue weight: corporate, wedding and party catering, the tiffin subscription hub, and the Durga Puja and Poila Baisakh pre-booking pages.',
      owners: ['Priya N.', 'Riya S.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-11-10',
      end: '2026-04-24',
      expectedOutcome: 'Dedicated conversion destinations for 28,600 monthly searches that previously landed on a static brochure homepage.',
      dependencies: ['p2-m2', 'p2-m3'],
      metrics: { keywords: 12, volume: '28,600' },
      tasks: [
        { id: 'p2-m8-t1', name: 'Launch /catering/corporate-catering-mumbai/ for the four-term BKC and Powai cluster', status: 'completed', due: '2025-11-28', owner: 'Riya S.' },
        { id: 'p2-m8-t2', name: 'Launch /daily-meals/tiffin-service-mumbai/ with 5-day and 20-day subscription tiers', status: 'completed', due: '2025-12-12', owner: 'Priya N.' },
        { id: 'p2-m8-t3', name: 'Publish /catering/wedding-catering-mumbai/ with ₹700-₹1,000 per-plate packages', status: 'completed', due: '2026-01-16', owner: 'Priya N.' },
        { id: 'p2-m8-t4', name: 'Publish /catering/party-catering-mumbai/ for 20 to 100 pax house-party enquiries', status: 'completed', due: '2026-01-30', owner: 'Priya N.' },
        { id: 'p2-m8-t5', name: 'Ship /festivals/durga-puja/ pre-booking page ahead of the 5,200 per month surge', status: 'completed', due: '2026-03-13', owner: 'Riya S.' },
        { id: 'p2-m8-t6', name: 'Ship /festivals/poila-baisakh/ feast page with festive gift meal pack bundles', status: 'completed', due: '2026-04-03', owner: 'Priya N.' },
        { id: 'p2-m8-t7', name: 'Add lead capture forms and WhatsApp handoff to all six landing templates', status: 'completed', due: '2026-04-24', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Four catering and daily-meals landing pages with package pricing tables', status: 'Delivered', due: '2026-01-30', owner: 'Priya N.', dependency: 'Catering price card sign-off', priority: 'Critical' },
        { name: 'Two festival pre-booking pages (Durga Puja, Poila Baisakh)', status: 'Delivered', due: '2026-04-03', owner: 'Riya S.', dependency: 'Festival menu confirmation', priority: 'Critical' },
        { name: 'Lead capture and WhatsApp handoff instrumentation on six templates', status: 'Delivered', due: '2026-04-24', owner: 'Aditya T.', dependency: 'GTM and CRM webhook', priority: 'High' }
      ]
    },

    {
      id: 'p2-m9',
      name: 'Location Pages',
      summary: 'Publish the three hyper-local hub pages — /locations/powai/, /locations/andheri-east/ and /locations/bkc/ — aligned to the GBP geofenced postal clusters and the 55.3% Emerald Isle sales concentration.',
      owners: ['Meera S.', 'Sohini B.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2026-01-05',
      end: '2026-08-14',
      expectedOutcome: 'Local pack and organic coverage on 4,300 monthly geo-intent searches in the three highest-value delivery corridors.',
      dependencies: ['p2-m8'],
      metrics: { keywords: 4, volume: '4,300' },
      tasks: [
        { id: 'p2-m9-t1', name: 'Publish /locations/powai/ for catering services powai and Powai tiffin intent (2,050)', status: 'completed', due: '2026-01-23', owner: 'Meera S.' },
        { id: 'p2-m9-t2', name: 'Embed Emerald Isle, Lake Homes and Castle Rock delivery proof on /locations/powai/', status: 'completed', due: '2026-02-13', owner: 'Meera S.' },
        { id: 'p2-m9-t3', name: 'Publish /locations/andheri-east/ for catering services andheri east (KD 22%, 1,200)', status: 'completed', due: '2026-03-27', owner: 'Meera S.' },
        { id: 'p2-m9-t4', name: 'Align location page NAP data with the ten GBP geofenced postal clusters', status: 'completed', due: '2026-05-15', owner: 'Meera S.' },
        { id: 'p2-m9-t5', name: 'Publish /locations/bkc/ for catering services bkc (KD 20%, 1,050)', status: 'in-progress', due: '2026-07-10', owner: 'Meera S.' },
        { id: 'p2-m9-t6', name: 'Add LocalBusiness schema and a driving-directions block to /locations/bkc/', status: 'not-started', due: '2026-09-22', owner: 'Vikram D.' }
      ],
      deliverables: [
        { name: 'Powai and Andheri East location hubs with society-level delivery proof', status: 'Delivered', due: '2026-03-27', owner: 'Meera S.', dependency: 'GBP service-area polygons', priority: 'Critical' },
        { name: 'NAP consistency audit across location pages, GBP and 20 Tier-1 citations', status: 'Delivered', due: '2026-05-15', owner: 'Meera S.', dependency: 'Phase 4 citation set', priority: 'High' },
        { name: 'BKC location hub targeting the corporate office lunch corridor', status: 'In Progress', due: '2026-07-10', owner: 'Meera S.', dependency: 'BKC delivery SLA confirmation', priority: 'High' },
        { name: 'LocalBusiness schema block for the BKC template', status: 'Pending', due: '2026-09-22', owner: 'Vikram D.', dependency: 'BKC hub publication', priority: 'Medium' }
      ]
    },

    {
      id: 'p2-m10',
      name: 'Content Refresh',
      summary: 'Re-optimise the 12 Bengali Food Mumbai cluster URLs — eight legacy dish pages plus the two festival pages and two commercial heads — to clear thin content and reset seasonal assets for the next cycle.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2026-05-04',
      end: '2026-08-31',
      expectedOutcome: 'Protects 28,650 monthly searches of earned visibility from decay and resets the festival pages before the next pre-booking window.',
      dependencies: ['p2-m6', 'p2-m8'],
      metrics: { keywords: 12, volume: '28,650' },
      tasks: [
        { id: 'p2-m10-t1', name: 'Audit the 12 Bengali Food Mumbai cluster URLs for thin and duplicated copy', status: 'completed', due: '2026-05-20', owner: 'Sohini B.' },
        { id: 'p2-m10-t2', name: 'Refresh /festivals/durga-puja/ with 2026 menu, pricing and pre-booking window', status: 'completed', due: '2026-06-12', owner: 'Priya N.' },
        { id: 'p2-m10-t3', name: 'Rewrite the /menu/bengali-food-delivery/ intro against the Box8 frozen-reheat gap', status: 'completed', due: '2026-07-03', owner: 'Priya N.' },
        { id: 'p2-m10-t4', name: 'Update Shukto, Doodh Katla and Postor Dum copy on the veg and fish curry pages', status: 'in-progress', due: '2026-07-31', owner: 'Priya N.' },
        { id: 'p2-m10-t5', name: 'Refresh photography and WebP assets across the eight legacy /menu/ dish pages', status: 'in-progress', due: '2026-08-21', owner: 'Riya S.' },
        { id: 'p2-m10-t6', name: 'Reoptimise /festivals/poila-baisakh/ for the next spring pre-booking cycle', status: 'not-started', due: '2026-09-26', owner: 'Priya N.' },
        { id: 'p2-m10-t7', name: 'Publish the refresh changelog and re-request indexing for all 12 cluster URLs', status: 'not-started', due: '2026-09-29', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Content decay audit across the 12-URL Bengali Food Mumbai cluster', status: 'Delivered', due: '2026-05-20', owner: 'Sohini B.', dependency: 'GSC 16-month export', priority: 'Medium' },
        { name: 'Refreshed Durga Puja pre-booking page with 2026 pricing', status: 'Delivered', due: '2026-06-12', owner: 'Priya N.', dependency: 'Festival menu confirmation', priority: 'High' },
        { name: 'Updated dish narrative and imagery set for eight legacy menu pages', status: 'In Progress', due: '2026-08-21', owner: 'Riya S.', dependency: 'Kitchen shoot slot', priority: 'Medium' },
        { name: 'Refresh changelog and reindexing submission log', status: 'Pending', due: '2026-09-29', owner: 'Sohini B.', dependency: 'Copy and imagery sign-off', priority: 'Low' }
      ]
    }
  ],

  risks: [
    { id: 'R2.1',
      risk: 'Bhojohori Manna (DR 42+) holds top-3 on best bengali restaurant mumbai (KD 42%, 4,400/mo); organic displacement is slower than the Month 6 model assumed.',
      impact: 'High',
      probability: 'Medium',
      owner: 'Sohini B.',
      mitigation: 'Revenue is banked on the 16 Critical sub-32% KD transactional terms first; the DR 42 head term is deferred to Phase 9 link acquisition rather than gating this phase.',
      status: 'Mitigating' },
    { id: 'R2.2',
      risk: 'Box8 and Rebel Foods programmatic pages outrank the tiffin hub on tiffin service mumbai (KD 38%, 4,500/mo), capping the 250-subscriber Month 12 target.',
      impact: 'High',
      probability: 'Medium',
      owner: 'Sohini B.',
      mitigation: 'Attack via the three lower-difficulty modifiers (bengali tiffin service 1,300, daily meal delivery 2,200, best tiffin service in powai 1,100) and FSSAI freshness proof the aggregators cannot claim.',
      status: 'Monitoring' },
    { id: 'R2.3',
      risk: 'Template and JSON-LD changes sit behind the client CMS deploy queue; a regression on the /menu/ template could silently drop MenuItem pricing markup.',
      impact: 'Medium',
      probability: 'Medium',
      owner: 'Rahul K.',
      mitigation: 'Weekly Rich Results regression check on all 18 URLs plus a staging gate before every template push, with a 2-day SLA agreed with the client dev team.',
      status: 'Mitigating' },
    { id: 'R2.4',
      risk: 'Seasonal surge terms have a fixed window; indexation lag on /festivals/durga-puja/ (5,200/mo) or /festivals/poila-baisakh/ (2,400/mo) would forfeit a full year of pre-booking demand.',
      impact: 'High',
      probability: 'Low',
      owner: 'Priya N.',
      mitigation: 'Both pages published and indexed 10 weeks ahead of the surge, with the Poila Baisakh reset scheduled in the Month 12 refresh cycle.',
      status: 'Monitoring' },
    { id: 'R2.5',
      risk: 'Eight legacy /menu/ dish pages still carry sub-400-word copy, exposing the cluster to helpful-content suppression across 28,650 monthly searches.',
      impact: 'Medium',
      probability: 'Medium',
      owner: 'Priya N.',
      mitigation: 'Content Refresh module rewrites all eight with provenance, pricing and basket-pairing copy; audit complete and two of three rewrite batches shipped.',
      status: 'Mitigating' },
    { id: 'R2.6',
      risk: 'The /locations/bkc/ hub has slipped past its 10 July target, leaving 1,050 monthly geo-intent searches and the BKC corporate lunch corridor uncovered in the final quarter.',
      impact: 'Medium',
      probability: 'Medium',
      owner: 'Meera S.',
      mitigation: 'Page build decoupled from the BKC delivery SLA sign-off; enquiry routing falls back to the corporate catering landing page until the hub is live.',
      status: 'Open' }
  ],

  kpis: [
    { label: 'Keywords ranking top 3 (Google India)', baseline: '< 5', target: '110+', current: '96', unit: '', direction: 'up' },
    { label: 'Keywords ranking top 10 (page 1)', baseline: '< 20', target: '300+', current: '271', unit: '', direction: 'up' },
    { label: 'Monthly organic website visits', baseline: '1,200', target: '25,000+', current: '21,400', unit: '', direction: 'up' },
    { label: 'Monthly direct meal orders (website)', baseline: '< 90', target: '1,250+', current: '1,040', unit: '', direction: 'up' },
    { label: 'Monthly qualified catering leads', baseline: '~8', target: '160+', current: '138', unit: '', direction: 'up' },
    { label: 'Mapped URLs live with valid JSON-LD', baseline: '0', target: '18', current: '17', unit: '', direction: 'up' }
  ]
});
