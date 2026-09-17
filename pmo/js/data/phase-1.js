/* Phase 1 — Website Audit & Foundation  |  source sheet: "Phase 1 - Website Audit" */
PMO.registerPhase({
  id: 'p1',
  number: 1,
  name: 'Website Audit & Foundation',
  subtitle: 'Baseline diagnostic across performance, schema, conversion and measurement',
  sourceSheet: 'Phase 1 - Website Audit',
  objective: 'Establish a verified technical, competitive and commercial baseline for the Howrah Bridge estate before any spend is committed downstream. The phase quantifies every defect blocking organic visibility and direct ordering — Core Web Vitals, structured data, URL architecture, mobile conversion — and installs the measurement spine (GA4, GTM, Meta CAPI, WhatsApp Business API) that all eleven remaining phases report against.',
  expectedOutcome: 'A costed, owner-assigned remediation backlog covering 10 audit dimensions, plus a frozen Month 0 baseline of 1,200 monthly organic visits, under 90 direct website orders and roughly 8 qualified catering leads per month.',
  riskLevel: 'Low',
  health: 'green',
  extraColumns: [
    { key: 'impact', label: 'Impact Level' },
    { key: 'finding', label: 'Key Finding' }
  ],
  modules: [
    {
      id: 'p1-m1',
      name: 'Technical SEO Audit',
      summary: 'Full crawl and Core Web Vitals diagnostic of the live site on throttled mobile 4G, covering LCP at 3.8s, CLS at 0.18, INP at 240ms, a flat URL hierarchy with no catering or delivery-zone silos, sitemap hygiene and canonicalisation.',
      owners: ['Rahul K.', 'Sohini B.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-01',
      end: '2025-10-14',
      expectedOutcome: 'A costed remediation backlog that takes mobile LCP below 2.1s and unlocks silo-based ranking for catering and delivery-zone pages.',
      dependencies: [],
      metrics: {
        impact: 'High',
        finding: 'LCP 3.8s, CLS 0.18, INP 240ms on mobile 4G'
      },
      tasks: [
        { id: 'p1-m1-t1', name: 'Benchmark LCP, CLS and INP across 25 top URLs on throttled mobile 4G', status: 'completed', due: '2025-10-03', owner: 'Rahul K.' },
        { id: 'p1-m1-t2', name: 'Size the uncompressed hero banner payload (>1.8MB JPEGs) for WebP conversion', status: 'completed', due: '2025-10-04', owner: 'Vikram D.' },
        { id: 'p1-m1-t3', name: 'Trace CLS 0.18 to unsized image tags and dynamically loaded web fonts', status: 'completed', due: '2025-10-06', owner: 'Vikram D.' },
        { id: 'p1-m1-t4', name: 'Profile 240ms INP against unbundled homepage JavaScript and unused CSS', status: 'completed', due: '2025-10-08', owner: 'Rahul K.' },
        { id: 'p1-m1-t5', name: 'Map the flat URL tree and specify /catering/, /daily-meals/ and /locations/ silos', status: 'completed', due: '2025-10-10', owner: 'Sohini B.' },
        { id: 'p1-m1-t6', name: 'Audit robots.txt and XML sitemap for lastmod, image and prioritisation tags', status: 'completed', due: '2025-10-11', owner: 'Sohini B.' },
        { id: 'p1-m1-t7', name: 'Log non-www redirect hops and trailing-slash URLs resolving 200 instead of 301', status: 'completed', due: '2025-10-13', owner: 'Rahul K.' }
      ],
      deliverables: [
        { name: 'Core Web Vitals remediation report (LCP / CLS / INP)', status: 'Delivered', due: '2025-10-14', owner: 'Rahul K.', dependency: 'Client staging access', priority: 'Critical' },
        { name: 'URL silo and information architecture blueprint', status: 'Delivered', due: '2025-10-14', owner: 'Sohini B.', dependency: 'Content inventory (p1-m2)', priority: 'High' },
        { name: 'Crawlability fix list: robots.txt, sitemap split, 301 canonicalisation', status: 'Delivered', due: '2025-10-12', owner: 'Sohini B.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p1-m2',
      name: 'Content Audit',
      summary: 'Page-level inventory of the brochure site against the 48-article editorial plan and the audited revenue mix, scoring coverage for the dishes that actually earn — Fish Fry at ₹66,309, Fish Chop at ₹53,692, Chicken Cutlet at ₹49,403, Kosha Mangsho at ₹49,585 and Shukto at 136 orders.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-08',
      end: '2025-10-27',
      expectedOutcome: 'A gap matrix that ranks every missing page by audited category revenue, giving the content calendar a commercial rather than editorial running order.',
      dependencies: ['p1-m1'],
      metrics: {
        impact: 'High',
        finding: 'Zero BOFU catering pages; no blog-to-order internal linking'
      },
      tasks: [
        { id: 'p1-m2-t1', name: 'Inventory all live URLs and tag each by funnel stage (TOFU / MOFU / BOFU)', status: 'completed', due: '2025-10-10', owner: 'Priya N.' },
        { id: 'p1-m2-t2', name: 'Score menu page coverage against the 10 audited revenue categories', status: 'completed', due: '2025-10-13', owner: 'Priya N.' },
        { id: 'p1-m2-t3', name: 'Flag missing dish pages for Fish Fry, Fish Chop, Kosha Mangsho and Shukto', status: 'completed', due: '2025-10-15', owner: 'Priya N.' },
        { id: 'p1-m2-t4', name: 'Audit blog-to-catering internal links and record the zero contextual coverage', status: 'completed', due: '2025-10-17', owner: 'Sohini B.' },
        { id: 'p1-m2-t5', name: 'Benchmark thin and duplicated copy across menu and category templates', status: 'completed', due: '2025-10-21', owner: 'Priya N.' },
        { id: 'p1-m2-t6', name: 'Map the 48-article calendar onto existing URLs and flag Month 1 to 4 gaps', status: 'completed', due: '2025-10-24', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Content inventory and gap matrix (URL, funnel stage, revenue tie-in)', status: 'Delivered', due: '2025-10-24', owner: 'Priya N.', dependency: 'CMS export from Howrah Ops', priority: 'High' },
        { name: 'Dish-page priority list ranked by audited category revenue', status: 'Delivered', due: '2025-10-27', owner: 'Priya N.', dependency: '—', priority: 'Medium' },
        { name: 'Internal linking specification from blogs to catering and order pages', status: 'Delivered', due: '2025-10-27', owner: 'Sohini B.', dependency: 'URL silo blueprint (p1-m1)', priority: 'High' }
      ]
    },
    {
      id: 'p1-m3',
      name: 'Competitor Audit',
      summary: 'Structured teardown of the five Mumbai operators in the Phase 2 landscape — Bhojohori Manna, Hangla’s, Oh! Calcutta, Box8 / Rebel Foods and the unorganised Powai dabba vendors — across organic footprint, GBP presence, paid activity and exploitable blind spots.',
      owners: ['Sohini B.', 'Nikhil C.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-06',
      end: '2025-10-24',
      expectedOutcome: 'A ranked attack strategy per competitor that concentrates spend on the mid-market catering and daily tiffin gaps none of the five currently defend.',
      dependencies: [],
      metrics: {
        impact: 'High',
        finding: 'Bhojohori Manna: DR 42+, 1,200+ reviews, zero active Meta Ads'
      },
      tasks: [
        { id: 'p1-m3-t1', name: 'Benchmark Bhojohori Manna DR 42+ footprint on generic Bengali restaurant terms', status: 'completed', due: '2025-10-09', owner: 'Sohini B.' },
        { id: 'p1-m3-t2', name: 'Audit aggregator dependence and weak standalone site presence at Hangla’s', status: 'completed', due: '2025-10-13', owner: 'Sohini B.' },
        { id: 'p1-m3-t3', name: 'Price Oh! Calcutta at ₹1,800+ per head and size the 20-100 pax mid-market gap', status: 'completed', due: '2025-10-16', owner: 'Nikhil C.' },
        { id: 'p1-m3-t4', name: 'Catalogue 50+ live Box8 / Rebel Foods Meta ad variations and discount CAC model', status: 'completed', due: '2025-10-18', owner: 'Nikhil C.' },
        { id: 'p1-m3-t5', name: 'Document Powai dabba vendors: no GBP, no FSSAI proof, erratic dispatch timings', status: 'completed', due: '2025-10-20', owner: 'Meera S.' },
        { id: 'p1-m3-t6', name: 'Convert the five vulnerability sets into a ranked per-competitor attack strategy', status: 'completed', due: '2025-10-23', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Competitive dossier: 5 operators across SEO, GBP, paid and vulnerabilities', status: 'Delivered', due: '2025-10-24', owner: 'Sohini B.', dependency: '—', priority: 'High' },
        { name: 'Share-of-voice and review-velocity benchmark against Bhojohori Manna', status: 'Delivered', due: '2025-10-22', owner: 'Meera S.', dependency: 'GBP insights pull', priority: 'Medium' },
        { name: 'Positioning brief: fresh regional authenticity vs Box8 pan-Indian menu', status: 'Delivered', due: '2025-10-24', owner: 'Nikhil C.', dependency: '—', priority: 'High' }
      ]
    },
    {
      id: 'p1-m4',
      name: 'Conversion Audit',
      summary: 'Funnel diagnostic of a site that still behaves as a static brochure: no 1-click WhatsApp checkout beside signature dishes, a six-field catering form abandoning at 82%, and mobile order CTAs clustered under 32px of padding.',
      owners: ['Aditya T.', 'Riya S.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-13',
      end: '2025-11-06',
      expectedOutcome: 'A prioritised CRO backlog with modelled uplift of +85% direct order rate, +65% catering form completion and +42% mobile interaction.',
      dependencies: ['p1-m1'],
      metrics: {
        impact: 'Severe',
        finding: 'Static brochure, no WhatsApp checkout; 82% catering form abandonment'
      },
      tasks: [
        { id: 'p1-m4-t1', name: 'Session-record 200 mobile journeys from menu view through to order intent', status: 'completed', due: '2025-10-17', owner: 'Aditya T.' },
        { id: 'p1-m4-t2', name: 'Quantify the 82% abandonment on the six-field catering enquiry form', status: 'completed', due: '2025-10-21', owner: 'Aditya T.' },
        { id: 'p1-m4-t3', name: 'Measure tap-target spacing on menu and WhatsApp CTAs against the 48px standard', status: 'completed', due: '2025-10-24', owner: 'Riya S.' },
        { id: 'p1-m4-t4', name: 'Specify 1-click WhatsApp order buttons for Bhetki Fish Fry and Kosha Mangsho', status: 'completed', due: '2025-10-29', owner: 'Riya S.' },
        { id: 'p1-m4-t5', name: 'Wireframe the sticky mobile bar for Call Kitchen and Order on WhatsApp', status: 'completed', due: '2025-11-03', owner: 'Riya S.' },
        { id: 'p1-m4-t6', name: 'Model uplift cases: +85% direct orders, +65% form completion, +42% mobile taps', status: 'completed', due: '2025-11-05', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Conversion friction audit with projected uplift per remediation', status: 'Delivered', due: '2025-11-06', owner: 'Aditya T.', dependency: '—', priority: 'Critical' },
        { name: 'Mobile ordering wireframes (sticky bar, 48px targets, WhatsApp deep links)', status: 'Delivered', due: '2025-11-05', owner: 'Riya S.', dependency: 'Brand asset handover', priority: 'Critical' },
        { name: '3-step catering cost calculator functional specification', status: 'Delivered', due: '2025-11-06', owner: 'Aditya T.', dependency: 'WhatsApp Business API access', priority: 'High' }
      ]
    },
    {
      id: 'p1-m5',
      name: 'Tracking Setup',
      summary: 'Installation of the measurement spine the programme runs on — GTM container, Meta Conversions API, WhatsApp Business API lead events, dynamic call tracking and a UTM taxonomy that closes the 5.3% of audited sales (₹1,31,000) carrying no delivery location.',
      owners: ['Aditya T.', 'Vikram D.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-15',
      end: '2025-11-12',
      expectedOutcome: 'Every order, call and catering enquiry is attributable to a source from Month 2 onward, ending the location data gap on new transactions.',
      dependencies: ['p1-m4'],
      metrics: {
        impact: 'High',
        finding: '₹1,31,000 (5.3%) of audited sales carry no location data'
      },
      tasks: [
        { id: 'p1-m5-t1', name: 'Deploy the GTM container and migrate all hard-coded page tags into it', status: 'completed', due: '2025-10-20', owner: 'Vikram D.' },
        { id: 'p1-m5-t2', name: 'Install Meta Conversions API with server-side event deduplication', status: 'completed', due: '2025-10-27', owner: 'Vikram D.' },
        { id: 'p1-m5-t3', name: 'Wire WhatsApp Business API order and enquiry events into the CRM', status: 'completed', due: '2025-11-03', owner: 'Aditya T.' },
        { id: 'p1-m5-t4', name: 'Enable dynamic call tracking on the kitchen number across paid and organic', status: 'completed', due: '2025-11-05', owner: 'Aditya T.' },
        { id: 'p1-m5-t5', name: 'Publish the UTM taxonomy for GBP catalog links and society WhatsApp broadcasts', status: 'completed', due: '2025-11-07', owner: 'Aditya T.' },
        { id: 'p1-m5-t6', name: 'Mandate address and postal-code capture at website and WhatsApp checkout', status: 'completed', due: '2025-11-11', owner: 'Vikram D.' }
      ],
      deliverables: [
        { name: 'GTM container with documented tag, trigger and variable map', status: 'Delivered', due: '2025-11-12', owner: 'Vikram D.', dependency: 'Client staging access', priority: 'Critical' },
        { name: 'Meta CAPI event schema (ViewContent, Lead, Purchase) with match quality', status: 'Delivered', due: '2025-11-10', owner: 'Devika V.', dependency: 'Meta Business Manager access', priority: 'High' },
        { name: 'UTM and lead-source taxonomy governing all 12 months of campaigns', status: 'Delivered', due: '2025-11-12', owner: 'Aditya T.', dependency: '—', priority: 'High' }
      ]
    },
    {
      id: 'p1-m6',
      name: 'Analytics Setup',
      summary: 'GA4, Search Console and rank tracking stood up against the audited Month 0 position — 1,200 monthly organic visits, under 90 direct website orders and roughly 8 qualified catering leads — so every later phase reports against a fixed, signed-off baseline.',
      owners: ['Aditya T.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-22',
      end: '2025-11-18',
      expectedOutcome: 'A single executive dashboard carrying all 10 programme KPIs from a certified Month 0 baseline through to the Month 12 targets.',
      dependencies: ['p1-m5'],
      metrics: {
        impact: 'High',
        finding: 'Month 0 baseline: 1,200 organic visits, <90 direct orders, ~8 leads'
      },
      tasks: [
        { id: 'p1-m6-t1', name: 'Configure the GA4 property, data streams and 12 conversion events', status: 'completed', due: '2025-10-27', owner: 'Aditya T.' },
        { id: 'p1-m6-t2', name: 'Verify Search Console and submit the split pages, menu and catering sitemaps', status: 'completed', due: '2025-10-30', owner: 'Sohini B.' },
        { id: 'p1-m6-t3', name: 'Freeze the Month 0 baseline at 1,200 organic visits and under 90 direct orders', status: 'completed', due: '2025-11-05', owner: 'Sohini B.' },
        { id: 'p1-m6-t4', name: 'Set up SEMrush rank tracking across the Phase 3 keyword clusters', status: 'completed', due: '2025-11-10', owner: 'Sohini B.' },
        { id: 'p1-m6-t5', name: 'Build the Looker Studio executive dashboard on the 10 programme KPIs', status: 'completed', due: '2025-11-14', owner: 'Aditya T.' },
        { id: 'p1-m6-t6', name: 'Reconcile GA4 direct orders against October kitchen dispatch records', status: 'completed', due: '2025-11-17', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'GA4 measurement plan with 12 conversion events and audience definitions', status: 'Delivered', due: '2025-11-14', owner: 'Aditya T.', dependency: 'GTM container live (p1-m5)', priority: 'High' },
        { name: 'Executive KPI dashboard tracking all 10 programme metrics', status: 'Delivered', due: '2025-11-18', owner: 'Aditya T.', dependency: '—', priority: 'High' },
        { name: 'Month 0 baseline certification signed off with Howrah Ops', status: 'Delivered', due: '2025-11-18', owner: 'Arjun M.', dependency: 'Kitchen dispatch records', priority: 'Critical' }
      ]
    },
    {
      id: 'p1-m7',
      name: 'Google Business Profile Audit',
      summary: 'Audit of the Powai GBP against the Local Pack standard: NAP accuracy for the Saki Vihar Road hub, primary category, geofenced service areas across 10 postal clusters, the absent menu catalog and a review base under 40 against Bhojohori Manna at 1,200+.',
      owners: ['Meera S.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2025-11-01',
      end: '2025-11-24',
      expectedOutcome: 'A fully populated profile with a weekly maintenance cadence, positioning the kitchen to contest the Powai local pack from Month 3.',
      dependencies: ['p1-m3'],
      metrics: {
        impact: 'High',
        finding: 'Under 40 reviews vs Bhojohori Manna 1,200+; no menu catalog live'
      },
      tasks: [
        { id: 'p1-m7-t1', name: 'Verify NAP consistency for the Powai hub off Saki Vihar Road (400072)', status: 'completed', due: '2025-11-05', owner: 'Meera S.' },
        { id: 'p1-m7-t2', name: 'Reset the primary category to Caterer and add four secondary categories', status: 'completed', due: '2025-11-08', owner: 'Meera S.' },
        { id: 'p1-m7-t3', name: 'Map service-area polygons across 10 postal clusters from Powai to Kanjurmarg', status: 'completed', due: '2025-11-12', owner: 'Meera S.' },
        { id: 'p1-m7-t4', name: 'Upload all six menu categories with pricing and UTM-tagged order links', status: 'completed', due: '2025-11-17', owner: 'Meera S.' },
        { id: 'p1-m7-t5', name: 'Baseline GBP performance at ~2,500 impressions and under 40 verified reviews', status: 'completed', due: '2025-11-19', owner: 'Sohini B.' },
        { id: 'p1-m7-t6', name: 'Start the Monday 5-photo geo-tagged upload cadence with the kitchen team', status: 'completed', due: '2025-11-21', owner: 'Howrah Ops' }
      ],
      deliverables: [
        { name: 'GBP audit with category, service-area and catalog remediation', status: 'Delivered', due: '2025-11-24', owner: 'Meera S.', dependency: 'GBP owner access', priority: 'High' },
        { name: 'Menu catalog upload: 6 categories with pricing and UTM links', status: 'Delivered', due: '2025-11-22', owner: 'Meera S.', dependency: 'Kitchen price list', priority: 'High' },
        { name: 'Review capture protocol (QR insert cards, post-dispatch WhatsApp link)', status: 'Delivered', due: '2025-11-24', owner: 'Meera S.', dependency: 'Packaging print run', priority: 'Medium' }
      ]
    },
    {
      id: 'p1-m8',
      name: 'Schema Audit',
      summary: 'Structured data review found only basic Organization markup live — no Restaurant, Menu, FoodEstablishment or CateringService schema — leaving menu pricing, the Mumbai service radius and FAQ content invisible to rich results.',
      owners: ['Rahul K.', 'Sohini B.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-10-03',
      end: '2025-10-20',
      expectedOutcome: 'Validated JSON-LD across the menu and catering tree, making dish pricing and service areas eligible for rich results ahead of the Pujo demand curve.',
      dependencies: ['p1-m1'],
      metrics: {
        impact: 'High',
        finding: 'Organization schema only; Restaurant / Menu / FoodEstablishment absent'
      },
      tasks: [
        { id: 'p1-m8-t1', name: 'Crawl all templates and log the Organization-only JSON-LD coverage', status: 'completed', due: '2025-10-06', owner: 'Rahul K.' },
        { id: 'p1-m8-t2', name: 'Specify Restaurant, Menu and FoodEstablishment JSON-LD for the menu tree', status: 'completed', due: '2025-10-10', owner: 'Sohini B.' },
        { id: 'p1-m8-t3', name: 'Model CateringService schema with Mumbai geocodes and service radius', status: 'completed', due: '2025-10-14', owner: 'Sohini B.' },
        { id: 'p1-m8-t4', name: 'Draft FAQ schema for catering pricing, delivery zones and lead times', status: 'completed', due: '2025-10-16', owner: 'Priya N.' },
        { id: 'p1-m8-t5', name: 'Validate all markup in the Rich Results Test and Schema.org validator', status: 'completed', due: '2025-10-19', owner: 'Rahul K.' }
      ],
      deliverables: [
        { name: 'JSON-LD spec: Restaurant, Menu, FoodEstablishment, CateringService', status: 'Delivered', due: '2025-10-20', owner: 'Sohini B.', dependency: '—', priority: 'Critical' },
        { name: 'Menu item pricing feed mapped to schema fields', status: 'Delivered', due: '2025-10-18', owner: 'Priya N.', dependency: 'Kitchen price list', priority: 'High' },
        { name: 'Rich Results validation log for 25 priority URLs', status: 'Delivered', due: '2025-10-20', owner: 'Rahul K.', dependency: 'Client staging access', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R1.1',
      risk: 'Client dev bandwidth on the shared hosting stack delays WebP conversion and CDN rollout past the Month 1 window.',
      impact: 'High', probability: 'Medium', owner: 'Rahul K.',
      mitigation: 'Two-day SLA agreed on staging pushes; agency held a fallback Cloudflare edge rollout and executed it in week 2.',
      status: 'Closed' },
    { id: 'R1.2',
      risk: 'Kitchen menu pricing drifts from the JSON-LD feed and the GBP catalog, exposing the site to structured data penalties.',
      impact: 'Medium', probability: 'Medium', owner: 'Sohini B.',
      mitigation: 'Weekly price sync with Howrah Ops mirrored into both the schema feed and the GBP catalog, with a Monday validator run.',
      status: 'Monitoring' },
    { id: 'R1.3',
      risk: 'WhatsApp Business API approval for the kitchen number slips, stalling 1-click checkout and lead event tracking.',
      impact: 'High', probability: 'Low', owner: 'Aditya T.',
      mitigation: 'Application filed in week 1 with click-to-chat deep links running as the interim fallback; approval landed 3 Nov.',
      status: 'Closed' },
    { id: 'R1.4',
      risk: 'Historic orders worth ₹1,31,000 (5.3% of audited sales) carry no delivery location, weakening geo-targeting baselines.',
      impact: 'Medium', probability: 'High', owner: 'Aditya T.',
      mitigation: 'Address and postal-code capture made mandatory at website and WhatsApp checkout; historic gap accepted and excluded from baselines.',
      status: 'Mitigating' },
    { id: 'R1.5',
      risk: 'URL silo restructuring risks ranking loss on existing /menu/ pages if the 301 redirect map is incomplete.',
      impact: 'High', probability: 'Low', owner: 'Sohini B.',
      mitigation: 'Full redirect map validated pre-launch; Search Console coverage and 404 logs monitored daily for 30 days post-migration.',
      status: 'Closed' },
    { id: 'R1.6',
      risk: 'Bhojohori Manna holds 1,200+ reviews against a base under 40, suppressing local pack entry while the review protocol ramps.',
      impact: 'Medium', probability: 'Medium', owner: 'Meera S.',
      mitigation: 'QR insert cards and post-dispatch WhatsApp review links live from Month 2 on a path to 500+ verified reviews in 12 months.',
      status: 'Monitoring' }
  ],
  kpis: [
    { label: 'Mobile LCP', baseline: '3.8s', target: '< 2.1s', current: '2.0s', unit: '', direction: 'down' },
    { label: 'Cumulative Layout Shift', baseline: '0.18', target: '< 0.10', current: '0.06', unit: '', direction: 'down' },
    { label: 'Interaction to Next Paint', baseline: '240ms', target: '< 150ms', current: '132ms', unit: '', direction: 'down' },
    { label: 'Menu URLs with valid Restaurant / Menu JSON-LD', baseline: '0', target: '100%', current: '100%', unit: '', direction: 'up' },
    { label: 'Mobile tap target on order CTAs', baseline: '32px', target: '48px', current: '48px', unit: '', direction: 'up' },
    { label: 'Conversion events live in GA4 and Meta CAPI', baseline: '0', target: '12', current: '12', unit: '', direction: 'up' }
  ],
  notes: 'Findings are drawn from the Phase 1 audit sheet and the live order dashboard (1,405 orders, ₹24.6L net sales, 255 unique buyers). Current KPI values were re-measured on 18 Nov 2025 after remediation sign-off; every subsequent phase reports against this certified Month 0 baseline.'
});
