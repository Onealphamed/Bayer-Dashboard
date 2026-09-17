/* Phase 3 — Content Marketing  |  source sheet: "Phase 5 - Content Calendar" */
PMO.registerPhase({
  id: 'p3',
  number: 3,
  name: 'Content Marketing',
  subtitle: 'A 48-article editorial engine plus ASMR video, B2B social and proof-led storytelling',
  sourceSheet: 'Phase 5 - Content Calendar',
  objective: 'Convert the Phase 5 editorial plan into a running publishing operation that feeds every commercial surface of the Howrah Bridge estate — the 48-blog calendar, the ASMR sizzle video series, B2B thought leadership for corporate catering, and customer proof assets. The phase is engineered around the 12 flagship articles specified by title, month, target keyword, funnel stage and lead goal, so that organic demand is captured against booked revenue intent rather than generic food traffic. It also supplies the creative inventory that Meta Campaign 2 (ASMR ThruPlay) and the paid lead-generation campaigns consume.',
  expectedOutcome: 'A published content estate carrying monthly organic traffic from a 1,200-visit Month 0 baseline toward the 25,000+ Month 12 goal, with the Instagram base grown from under 1,500 to roughly 24,000 and every BOFU article wired to a catering or tiffin conversion path.',
  riskLevel: 'Medium',
  health: 'amber',
  extraColumns: [
    { key: 'output', label: 'Output Volume' },
    { key: 'funnel', label: 'Funnel Focus' }
  ],
  modules: [
    {
      id: 'p3-m1',
      name: 'Blog Creation',
      summary: 'Execution of the 48-article editorial calendar, led by the 12 flagship pieces specified in the workbook by title, month, target keyword and lead goal — from the Month 1 wedding catering pair through to the Month 8 corporate gala article. Production is running behind plan: 39 of 48 articles are live against a Month 12 target of 48.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-10-15',
      end: '2026-09-30',
      expectedOutcome: 'A BOFU-weighted article estate that captures wedding, corporate and tiffin demand at source and routes it into catering quotes and direct orders.',
      dependencies: ['p3-m2', 'p1-m2'],
      metrics: {
        output: '39 of 48 blogs live',
        funnel: 'BOFU-weighted (8 of 12 flagships)'
      },
      tasks: [
        { id: 'p3-m1-t1', name: 'Publish Blogs 1-2 on "bengali wedding caterers mumbai" and "bengali wedding catering cost"', status: 'completed', due: '2025-10-31', owner: 'Priya N.' },
        { id: 'p3-m1-t2', name: 'Publish "Why Basanti Pulao and Kosha Mangsho Rule Bengali Feasts (The Royal Pair)"', status: 'completed', due: '2025-11-07', owner: 'Priya N.' },
        { id: 'p3-m1-t3', name: 'Ship the BKC HR Administrator Playbook and "daily tiffin service andheri east" BOFU pair', status: 'completed', due: '2025-11-28', owner: 'Priya N.' },
        { id: 'p3-m1-t4', name: 'Publish "The Kolkata Biryani Story: Why the Potato and Egg are Non-Negotiable"', status: 'completed', due: '2025-12-19', owner: 'Sohini B.' },
        { id: 'p3-m1-t5', name: 'Publish the Durga Puja Feast Guide on "durga puja food delivery mumbai" before Pujo', status: 'completed', due: '2026-03-20', owner: 'Priya N.' },
        { id: 'p3-m1-t6', name: 'Clear the 9-article Month 9-11 backlog against the 48-blog editorial target', status: 'in-progress', due: '2026-08-31', owner: 'Priya N.' },
        { id: 'p3-m1-t7', name: 'Publish "Corporate Year-End Gala Dinners: Planning Buffets for 100+ Guests in BKC"', status: 'in-progress', due: '2026-09-05', owner: 'Priya N.' },
        { id: 'p3-m1-t8', name: 'Draft the final Month 12 articles on the spring menu and Poila Baisakh search assets', status: 'not-started', due: '2026-09-30', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: '12 flagship articles against title, keyword, funnel stage and lead goal', status: 'In Progress', due: '2026-09-30', owner: 'Priya N.', dependency: 'Freelance Bengali-fluent writer capacity', priority: 'Critical' },
        { name: 'Month 1-8 published article set (39 of 48 live)', status: 'Delivered', due: '2026-08-31', owner: 'Priya N.', dependency: '—', priority: 'High' },
        { name: 'Recovery plan for the 9-article Month 9-11 backlog', status: 'In Review', due: '2026-09-22', owner: 'Arjun M.', dependency: 'Client content sign-off SLA', priority: 'High' }
      ]
    },
    {
      id: 'p3-m2',
      name: 'Content Calendar',
      summary: 'Governance of the 48-blog editorial calendar itself — each slot mapped to an operating month, a primary target keyword, a funnel stage, a search intent and a stated lead goal, from 15+ wedding RFP downloads in Month 1 to 8+ closed corporate galas in Month 8.',
      owners: ['Priya N.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-15',
      end: '2026-06-30',
      expectedOutcome: 'A commercially sequenced publishing schedule that puts every seasonal and B2B article in front of its search window rather than after it.',
      dependencies: ['p1-m2'],
      metrics: {
        output: '48 slots mapped to 12 months',
        funnel: 'TOFU / MOFU / BOFU mix'
      },
      tasks: [
        { id: 'p3-m2-t1', name: 'Lock the 48-blog calendar to month, target keyword, funnel stage and lead goal', status: 'completed', due: '2025-10-24', owner: 'Priya N.' },
        { id: 'p3-m2-t2', name: 'Slot "5 Essential Items in an Authentic Kolkata Non-Veg Thali" as the MOFU converter', status: 'completed', due: '2025-11-14', owner: 'Sohini B.' },
        { id: 'p3-m2-t3', name: 'Schedule "House Party Catering in Powai: Stress-Free Hosting for 20-50 Guests"', status: 'completed', due: '2025-12-12', owner: 'Sohini B.' },
        { id: 'p3-m2-t4', name: 'Brief "Tiffin Services vs Cooking at Home: True Monthly Cost Breakdown in Mumbai"', status: 'completed', due: '2026-01-23', owner: 'Priya N.' },
        { id: 'p3-m2-t5', name: 'Calendar the "poila baisakh catering mumbai" feature for the Month 7 festive climax', status: 'completed', due: '2026-04-10', owner: 'Priya N.' },
        { id: 'p3-m2-t6', name: 'Rebaseline the Month 8-12 slots against actual publishing throughput and KD ceilings', status: 'completed', due: '2026-06-26', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: '48-slot editorial calendar (month, keyword, funnel stage, intent, lead goal)', status: 'Delivered', due: '2025-10-24', owner: 'Priya N.', dependency: 'Phase 3 keyword architecture', priority: 'Critical' },
        { name: 'Seasonal publishing windows for Durga Puja and Poila Baisakh assets', status: 'Delivered', due: '2026-04-10', owner: 'Sohini B.', dependency: 'Kitchen capacity forecast from Howrah Ops', priority: 'High' },
        { name: 'Month 8-12 rebaselined schedule with throughput assumptions', status: 'Delivered', due: '2026-06-30', owner: 'Priya N.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p3-m3',
      name: 'Video Content',
      summary: 'The brand media bank and long-form video programme: 15 reels and 30 dish photos built in Month 1, the ASMR sizzle hero footage of Bhetki Fish Fry hitting mustard oil, the kitchen hygiene tour, wedding showcase films and the Month 12 annual brand overview.',
      owners: ['Riya S.', 'Priya N.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-20',
      end: '2026-09-12',
      expectedOutcome: 'A reusable creative bank that supplies Meta Campaign 2 ThruPlay inventory at a cost per completion below ₹0.35 and removes per-campaign shoot dependency.',
      dependencies: [],
      metrics: {
        output: '15 reels + 30 dish photos',
        funnel: 'TOFU — ASMR sizzle'
      },
      tasks: [
        { id: 'p3-m3-t1', name: 'Build the brand media bank: 15 reels and 30 dish photos for the Month 1 launch', status: 'completed', due: '2025-11-07', owner: 'Riya S.' },
        { id: 'p3-m3-t2', name: 'Shoot the ASMR hero: Bhetki Fish Fry hitting mustard oil in 15-second cutdowns', status: 'completed', due: '2025-11-21', owner: 'Riya S.' },
        { id: 'p3-m3-t3', name: 'Cut the brand film "Bringing the Soul of Bengal to the Heart of Mumbai" to 15s', status: 'completed', due: '2025-12-05', owner: 'Riya S.' },
        { id: 'p3-m3-t4', name: 'Film the behind-the-scenes kitchen hygiene tour for the Month 5 seasonal series', status: 'completed', due: '2026-02-20', owner: 'Howrah Ops' },
        { id: 'p3-m3-t5', name: 'Produce the customer celebration compilation video for the Month 7 festive window', status: 'completed', due: '2026-04-24', owner: 'Priya N.' },
        { id: 'p3-m3-t6', name: 'Shoot the wedding catering showcase films for the Month 9 SEO campaign', status: 'completed', due: '2026-06-26', owner: 'Riya S.' },
        { id: 'p3-m3-t7', name: 'Release the annual brand overview video with spring menu B-roll', status: 'completed', due: '2026-09-11', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'Brand media bank: 15 reels, 30 geo-tagged dish photos', status: 'Delivered', due: '2025-11-07', owner: 'Riya S.', dependency: 'Kitchen shoot access from Howrah Ops', priority: 'Critical' },
        { name: 'ASMR sizzle master library (Bhetki Fish Fry, Kosha Mangsho, Fish Chop)', status: 'Delivered', due: '2025-12-05', owner: 'Riya S.', dependency: '—', priority: 'High' },
        { name: 'Wedding catering showcase film set for vendor portal syndication', status: 'Delivered', due: '2026-06-26', owner: 'Riya S.', dependency: 'Wedding client release forms', priority: 'High' },
        { name: 'Annual brand overview video (Month 12)', status: 'Delivered', due: '2026-09-12', owner: 'Priya N.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p3-m4',
      name: 'Reels Strategy',
      summary: 'The ASMR sizzle reel cadence — one reel per week from Month 2, stepping to 3x weekly from Month 7 — published in 9:16 for Reels and Stories and fed into Meta Campaign 2 at a ₹12,000 monthly budget against a sub-₹0.35 cost per ThruPlay.',
      owners: ['Riya S.', 'Devika V.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-11-03',
      end: '2026-09-30',
      expectedOutcome: 'A sustained 3x weekly vertical output delivering 35,000+ monthly video completions and the organic engine behind a 25,000-strong Instagram base.',
      dependencies: ['p3-m3'],
      metrics: {
        output: '3x weekly from Month 7',
        funnel: 'TOFU / MOFU'
      },
      tasks: [
        { id: 'p3-m4-t1', name: 'Launch the weekly ASMR Sizzle series at one reel per week from Month 2', status: 'completed', due: '2025-11-28', owner: 'Riya S.' },
        { id: 'p3-m4-t2', name: 'Route top ThruPlay reels into Meta Campaign 2 at a ₹12,000 monthly budget', status: 'completed', due: '2026-01-16', owner: 'Devika V.' },
        { id: 'p3-m4-t3', name: 'Step reel output to 3x weekly from Month 7 across Reels and Stories 9:16', status: 'completed', due: '2026-04-10', owner: 'Riya S.' },
        { id: 'p3-m4-t4', name: 'Rank reels on cost per ThruPlay against ₹0.35 and retire the bottom quartile', status: 'completed', due: '2026-05-22', owner: 'Devika V.' },
        { id: 'p3-m4-t5', name: 'Publish holiday party appetizer reels for Kolkata Chinese and kebab platters', status: 'completed', due: '2026-07-31', owner: 'Riya S.' },
        { id: 'p3-m4-t6', name: 'Hold the 3x weekly cadence through Month 12 on spring menu and milestone cuts', status: 'in-progress', due: '2026-09-30', owner: 'Riya S.' }
      ],
      deliverables: [
        { name: 'Weekly ASMR Sizzle reel series (Month 2 onward)', status: 'Delivered', due: '2026-04-10', owner: 'Riya S.', dependency: 'Brand media bank (p3-m3)', priority: 'High' },
        { name: '3x weekly reel production schedule and shot list', status: 'Delivered', due: '2026-04-10', owner: 'Riya S.', dependency: 'Kitchen shoot windows', priority: 'High' },
        { name: 'ThruPlay performance ranking and creative retirement log', status: 'In Progress', due: '2026-09-30', owner: 'Devika V.', dependency: 'Meta Business Suite reporting', priority: 'Medium' }
      ]
    },
    {
      id: 'p3-m5',
      name: 'Social Content',
      summary: 'Organic Instagram and Facebook programming for the Mumbai Bengali community — the Kolkata Biryani potato debate, the cultural heritage storytelling series, festive gift meal packs and society-level features across Emerald Isle, Godrej Platinum and Lake Homes.',
      owners: ['Priya N.', 'Meera S.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2025-11-10',
      end: '2026-09-30',
      expectedOutcome: 'A hyper-local following grown from under 1,500 to 25,000+ with cultural engagement sustained at a cost per engagement below ₹1.10.',
      dependencies: ['p3-m3'],
      metrics: {
        output: '5 posts + 3 stories weekly',
        funnel: 'TOFU engagement'
      },
      tasks: [
        { id: 'p3-m5-t1', name: 'Run the "Does authentic Kolkata Biryani require a potato?" engagement poll', status: 'completed', due: '2025-12-12', owner: 'Priya N.' },
        { id: 'p3-m5-t2', name: 'Launch the cultural heritage storytelling series across Instagram and Facebook', status: 'completed', due: '2026-01-09', owner: 'Priya N.' },
        { id: 'p3-m5-t3', name: 'Push festive gift meal pack creatives for Durga Puja pre-booking', status: 'completed', due: '2026-03-27', owner: 'Priya N.' },
        { id: 'p3-m5-t4', name: 'Post weekly society features for Emerald Isle, Godrej Platinum and Lake Homes', status: 'completed', due: '2026-06-19', owner: 'Meera S.' },
        { id: 'p3-m5-t5', name: 'Run the Month 12 milestone story series toward 25,000 Instagram followers', status: 'in-progress', due: '2026-09-25', owner: 'Priya N.' },
        { id: 'p3-m5-t6', name: 'Sync the Monday 5-photo GBP upload with the Instagram grid calendar', status: 'in-progress', due: '2026-09-30', owner: 'Meera S.' }
      ],
      deliverables: [
        { name: 'Cultural heritage storytelling series (12 episodes)', status: 'Delivered', due: '2026-06-19', owner: 'Priya N.', dependency: '—', priority: 'Medium' },
        { name: 'Society-level content plan for Powai and Vikhroli gated complexes', status: 'Delivered', due: '2026-06-19', owner: 'Meera S.', dependency: 'Society committee approvals', priority: 'Medium' },
        { name: 'Month 12 customer milestone story series', status: 'In Progress', due: '2026-09-30', owner: 'Priya N.', dependency: 'Customer Stories assets (p3-m8)', priority: 'High' }
      ]
    },
    {
      id: 'p3-m6',
      name: 'LinkedIn Content',
      summary: 'B2B corporate catering thought leadership aimed at HR administrators and office managers in BKC and Andheri MIDC, built on the Phase 9 Tier 3 pitch angle "Upgrading Workplace Productivity Through Wholesome Home-Style Meal Subscriptions".',
      owners: ['Nikhil C.', 'Priya N.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-12-01',
      end: '2026-09-30',
      expectedOutcome: 'A B2B demand channel supporting the 25 booked events per month and 250 recurring subscriber run-rate targets through named corporate accounts.',
      dependencies: ['p3-m7'],
      metrics: {
        output: '2 B2B posts weekly',
        funnel: 'BOFU — B2B corporate'
      },
      tasks: [
        { id: 'p3-m6-t1', name: 'Stand up the LinkedIn company page with the corporate catering service catalogue', status: 'completed', due: '2026-01-16', owner: 'Nikhil C.' },
        { id: 'p3-m6-t2', name: 'Publish "Upgrading Workplace Productivity Through Home-Style Meal Subscriptions"', status: 'completed', due: '2026-03-13', owner: 'Nikhil C.' },
        { id: 'p3-m6-t3', name: 'Run the Month 8 B2B series on year-end gala buffet planning for BKC offices', status: 'completed', due: '2026-05-22', owner: 'Priya N.' },
        { id: 'p3-m6-t4', name: 'Target HR administrators and office managers across Andheri MIDC and Powai', status: 'completed', due: '2026-07-10', owner: 'Nikhil C.' },
        { id: 'p3-m6-t5', name: 'Pitch People Matters and HR Katha for 5 B2B contextual links this quarter', status: 'in-progress', due: '2026-09-25', owner: 'Nikhil C.' },
        { id: 'p3-m6-t6', name: 'Publish the corporate subscription ROI post series for annual contract renewals', status: 'in-progress', due: '2026-09-30', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'LinkedIn company page and corporate catering service catalogue', status: 'Delivered', due: '2026-01-16', owner: 'Nikhil C.', dependency: 'Brand asset pack from Riya S.', priority: 'High' },
        { name: 'Workplace productivity thought leadership pillar article', status: 'Delivered', due: '2026-03-13', owner: 'Nikhil C.', dependency: '—', priority: 'High' },
        { name: 'HR administrator outreach list for BKC and Andheri MIDC', status: 'In Review', due: '2026-09-25', owner: 'Nikhil C.', dependency: 'CRM export from Aditya T.', priority: 'Medium' }
      ]
    },
    {
      id: 'p3-m7',
      name: 'Case Studies',
      summary: 'Corporate subscription case studies commissioned in the Month 8 B2B push, quantifying the ₹4,500 average subscription value and the path to 250 active recurring subscribers for named BKC and Andheri MIDC accounts.',
      owners: ['Priya N.', 'Aditya T.'],
      priority: 'High',
      status: 'in-progress',
      start: '2026-05-04',
      end: '2026-09-25',
      expectedOutcome: 'Evidence-led BOFU assets that shorten the corporate sales cycle and underpin the gated 2026 Catering Pricing Guide used in Meta lead forms.',
      dependencies: ['p3-m1'],
      metrics: {
        output: '4 corporate case studies',
        funnel: 'BOFU — B2B contract'
      },
      tasks: [
        { id: 'p3-m7-t1', name: 'Interview three corporate subscription clients across BKC and Andheri MIDC', status: 'completed', due: '2026-05-29', owner: 'Priya N.' },
        { id: 'p3-m7-t2', name: 'Quantify subscription economics at ₹4,500 AOV against the 250-subscriber target', status: 'completed', due: '2026-06-26', owner: 'Aditya T.' },
        { id: 'p3-m7-t3', name: 'Publish the case study set on /catering/corporate-catering-mumbai/', status: 'completed', due: '2026-07-24', owner: 'Priya N.' },
        { id: 'p3-m7-t4', name: 'Design the gated 2026 Catering Pricing Guide around the case study evidence', status: 'completed', due: '2026-08-21', owner: 'Riya S.' },
        { id: 'p3-m7-t5', name: 'Build the year-end gala case study from Month 8 BKC buffet bookings', status: 'in-progress', due: '2026-09-25', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'Corporate subscription case study set (3 named accounts)', status: 'Delivered', due: '2026-07-24', owner: 'Priya N.', dependency: 'Client legal sign-off on naming', priority: 'Critical' },
        { name: '2026 Catering Pricing Guide (gated lead magnet)', status: 'Delivered', due: '2026-08-21', owner: 'Riya S.', dependency: 'Kitchen costing from Howrah Ops', priority: 'High' },
        { name: 'Year-end gala case study for BKC corporate buyers', status: 'In Progress', due: '2026-09-25', owner: 'Priya N.', dependency: 'Event photography release', priority: 'High' }
      ]
    },
    {
      id: 'p3-m8',
      name: 'Customer Stories',
      summary: 'First-person proof from the customer base — recorded interviews with past wedding clients in the Month 9 wedding push, the Month 7 customer celebration compilation, and milestone stories from the 15 Mega Loyalists who drive 33.5% of audited sales.',
      owners: ['Priya N.', 'Riya S.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2026-04-06',
      end: '2026-09-30',
      expectedOutcome: 'Social proof that lifts wedding and event enquiry quality and supplies vendor portals with credible, linkable editorial assets.',
      dependencies: ['p3-m3'],
      metrics: {
        output: '9 stories + 2 compilations',
        funnel: 'MOFU social proof'
      },
      tasks: [
        { id: 'p3-m8-t1', name: 'Produce the Month 7 customer celebration compilation from festive order footage', status: 'completed', due: '2026-04-24', owner: 'Priya N.' },
        { id: 'p3-m8-t2', name: 'Record interviews with past wedding clients for the Month 9 showcase', status: 'completed', due: '2026-06-12', owner: 'Priya N.' },
        { id: 'p3-m8-t3', name: 'Cut the wedding client interviews into 60-second vertical testimonial edits', status: 'completed', due: '2026-06-26', owner: 'Riya S.' },
        { id: 'p3-m8-t4', name: 'Syndicate wedding stories to WedMeGood and ShaadiSaga vendor profiles', status: 'completed', due: '2026-07-31', owner: 'Nikhil C.' },
        { id: 'p3-m8-t5', name: 'Collect stories from the 15 Mega Loyalists driving 33.5% of audited sales', status: 'completed', due: '2026-08-28', owner: 'Priya N.' },
        { id: 'p3-m8-t6', name: 'Publish the Month 12 milestone story reel alongside the brand overview video', status: 'in-progress', due: '2026-09-30', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'Wedding client interview library (6 recorded testimonials)', status: 'Delivered', due: '2026-06-26', owner: 'Priya N.', dependency: 'Wedding client release forms', priority: 'High' },
        { name: 'Customer celebration compilation video (Month 7)', status: 'Delivered', due: '2026-04-24', owner: 'Riya S.', dependency: 'Festive order footage from Howrah Ops', priority: 'Medium' },
        { name: 'Mega Loyalist milestone story set', status: 'In Progress', due: '2026-09-30', owner: 'Priya N.', dependency: 'CRM cohort list (77 dormant / 15 loyalists)', priority: 'Medium' }
      ]
    },
    {
      id: 'p3-m9',
      name: 'Content Distribution',
      summary: 'The push layer for everything produced in this phase: contextual internal links from every blog into catering and order pages, weekly GBP repurposing, WhatsApp broadcast to the regulars list, editorial pickups on LBB Mumbai and Curly Tales, and UTM-tagged reporting in GA4.',
      owners: ['Sohini B.', 'Nikhil C.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-11-17',
      end: '2026-09-30',
      expectedOutcome: 'Every published asset reaches owned, earned and local surfaces within 48 hours and is attributable to organic visits, leads and orders in GA4.',
      dependencies: ['p3-m1', 'p3-m5'],
      metrics: {
        output: 'Weekly multi-channel push',
        funnel: 'Full funnel'
      },
      tasks: [
        { id: 'p3-m9-t1', name: 'Wire contextual internal links from every blog to catering and order pages', status: 'completed', due: '2025-12-19', owner: 'Sohini B.' },
        { id: 'p3-m9-t2', name: 'Repurpose blog content into weekly GBP posts and the Monday 5-photo upload', status: 'completed', due: '2026-02-13', owner: 'Meera S.' },
        { id: 'p3-m9-t3', name: 'Broadcast festive pre-booking content to the WhatsApp regulars list', status: 'completed', due: '2026-04-17', owner: 'Priya N.' },
        { id: 'p3-m9-t4', name: 'Place LBB Mumbai and Curly Tales editorial pickups of the heritage series', status: 'completed', due: '2026-06-19', owner: 'Nikhil C.' },
        { id: 'p3-m9-t5', name: 'Syndicate the Month 9-11 backlog to newsletter, WhatsApp and LinkedIn on publish', status: 'in-progress', due: '2026-09-08', owner: 'Sohini B.' },
        { id: 'p3-m9-t6', name: 'Instrument UTM-tagged distribution reporting for every Month 12 asset in GA4', status: 'not-started', due: '2026-09-30', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Blog-to-catering internal linking map (all published URLs)', status: 'Delivered', due: '2025-12-19', owner: 'Sohini B.', dependency: 'URL silo blueprint (p1-m1)', priority: 'High' },
        { name: 'Weekly repurposing runbook for GBP, WhatsApp and Instagram', status: 'Delivered', due: '2026-02-13', owner: 'Meera S.', dependency: '—', priority: 'Medium' },
        { name: 'Editorial pickup log for Tier 1 food and lifestyle outlets', status: 'Delivered', due: '2026-06-19', owner: 'Nikhil C.', dependency: 'Press kit and founder availability', priority: 'High' },
        { name: 'UTM distribution attribution dashboard in GA4', status: 'Pending', due: '2026-09-30', owner: 'Aditya T.', dependency: 'Backlog clearance (p3-m1)', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R3.1',
      risk: 'The 48-blog target is running behind: 39 articles are live with 9 outstanding entering Month 12, putting the 25,000 organic visit goal at risk.',
      impact: 'High', probability: 'High', owner: 'Priya N.',
      mitigation: 'A second Bengali-fluent freelance writer was onboarded in August; the Month 9-11 backlog is sequenced BOFU-first so commercial articles land before the calendar closes.',
      status: 'Mitigating' },
    { id: 'R3.2',
      risk: 'The 3x weekly reel cadence from Month 7 depends on kitchen downtime for shoots, which festive and catering peaks repeatedly compress.',
      impact: 'Medium', probability: 'Medium', owner: 'Riya S.',
      mitigation: 'Two fixed Tuesday and Friday morning shoot windows agreed with Howrah Ops, with a four-week buffer of edited reels held in the media bank.',
      status: 'Monitoring' },
    { id: 'R3.3',
      risk: 'Corporate subscription case studies require legal sign-off to name BKC and Andheri MIDC accounts; anonymised versions convert materially worse in BOFU contexts.',
      impact: 'High', probability: 'Medium', owner: 'Nikhil C.',
      mitigation: 'Consent requested at contract signature from Month 8; two accounts approved naming, the third publishes as a sector-level study with verified figures.',
      status: 'Mitigating' },
    { id: 'R3.4',
      risk: 'Wedding client interviews depend on release forms from private events; withheld consent removes the strongest proof assets from the Month 9 wedding push.',
      impact: 'Medium', probability: 'Medium', owner: 'Priya N.',
      mitigation: 'Release forms now issued with every catering quote; six of eight approached clients consented, and portal syndication uses only cleared footage.',
      status: 'Monitoring' },
    { id: 'R3.5',
      risk: 'Seasonal articles published after their search window forfeit the peak entirely — "durga puja food delivery mumbai" at 5,200 monthly searches and "poila baisakh feast delivery mumbai" at 2,400 recur only annually.',
      impact: 'High', probability: 'Low', owner: 'Sohini B.',
      mitigation: 'Both festive features were locked to a six-week pre-window in the calendar and published on schedule in Month 6 and Month 7.',
      status: 'Closed' },
    { id: 'R3.6',
      risk: 'Blog articles and the catering silo pages compete for the same B2B terms, notably "corporate event caterers mumbai" and "office lunch catering bkc".',
      impact: 'Medium', probability: 'Medium', owner: 'Sohini B.',
      mitigation: 'One canonical target page per keyword enforced in the calendar; blogs carry supporting long-tail intent and link upward to the silo landing page.',
      status: 'Monitoring' }
  ],
  kpis: [
    { label: 'Blogs published against the 48-article calendar', baseline: '0', target: '48', current: '39', unit: '', direction: 'up' },
    { label: 'Monthly organic website visits', baseline: '1,200', target: '25,000+', current: '21,400', unit: '', direction: 'up' },
    { label: 'Hyper-local Instagram following', baseline: '< 1,500', target: '25,000+', current: '23,600', unit: '', direction: 'up' },
    { label: 'Reel output per week (from Month 7)', baseline: '0', target: '3', current: '3', unit: '', direction: 'up' },
    { label: 'Monthly ASMR video completions', baseline: '0', target: '35,000+', current: '36,800', unit: '', direction: 'up' },
    { label: 'Cost per ThruPlay', baseline: '₹0.62', target: '< ₹0.35', current: '₹0.31', unit: '', direction: 'down' }
  ],
  notes: 'Article titles, target keywords, funnel stages and lead goals are taken verbatim from the Phase 5 editorial calendar; production cadence, video output and outreach milestones follow the Phase 10 month-by-month roadmap. Phase health is amber solely on publishing throughput — 39 of 48 articles are live against a Month 12 target of 48, with three items now overdue. Video, reel and B2B workstreams are on or ahead of plan.'
});
