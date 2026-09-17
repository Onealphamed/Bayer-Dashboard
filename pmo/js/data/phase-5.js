/* Phase 5 — Meta Ads  |  source sheet: "Phase 6 - Meta Ads Plan" */
PMO.registerPhase({
  id: 'p5',
  number: 5,
  name: 'Meta Ads',
  subtitle: 'Seven-campaign Facebook and Instagram architecture running ₹1,20,000 a month',
  sourceSheet: 'Phase 6 - Meta Ads Plan',
  objective: 'Operate the Phase 6 paid social architecture as a single full-funnel system across Facebook and Instagram, moving Mumbai audiences from cinematic brand exposure through ASMR video, cultural engagement and menu traffic into catering leads, WhatsApp chats and retargeted repeat orders. The seven campaigns carry a fixed ₹1,20,000 monthly budget with an individually stated KPI ceiling each — CPM under ₹85, cost per ThruPlay under ₹0.35, cost per engagement under ₹1.10, CPC under ₹6.20, cost per lead under ₹230, cost per chat under ₹16 and a 4.5x target ROAS. Spend is deliberately weighted toward the two conversion campaigns and the 5 km Powai and Andheri delivery catchment that already generates 55.3% of audited sales.',
  expectedOutcome: 'A paid social engine delivering 180,000+ monthly reach, 35,000+ video completions, 3,500+ menu visits, 110+ qualified catering leads and 1,250+ direct WhatsApp chats, lifting blended paid ROAS from a 1.8x baseline toward the 4.2x+ Month 12 goal while reactivating at least 25 of the 77 dormant regulars.',
  riskLevel: 'Medium',
  health: 'green',
  extraColumns: [
    { key: 'budget', label: 'Monthly Budget' },
    { key: 'reach', label: 'Expected Reach' },
    { key: 'leads', label: 'Expected Leads / Result' }
  ],
  modules: [
    {
      id: 'p5-m1',
      name: 'Brand Awareness',
      summary: 'Campaign 1 (Kolkata Soul in Mumbai) at ₹15,000 a month: a cinematic brand film built on the line "Bringing the Soul of Bengal to the Heart of Mumbai", cut to 15-second edits and served to Mumbai eastern and western suburbs — Powai, Andheri, BKC, Bandra and Chembur — at ages 24-55. The flight was launched in Month 1 alongside the Google corporate catering search build and closed in Month 11 having held CPM below the ₹85 ceiling.',
      owners: ['Devika V.', 'Riya S.'],
      priority: 'High',
      status: 'completed',
      start: '2025-10-20',
      end: '2026-08-31',
      expectedOutcome: 'Establishes Howrah Bridge as the recognised Bengali kitchen for 196,500 Mumbai professionals a month, seeding every lower-funnel campaign with a warm audience.',
      dependencies: ['p3-m3', 'p1-m5'],
      metrics: {
        budget: '₹15,000 / mo',
        reach: '180,000+ targeted professionals',
        leads: 'CPM < ₹85 (running ₹79)'
      },
      tasks: [
        { id: 'p5-m1-t1', name: 'Build the Campaign 1 geofence: Powai, Andheri, BKC, Bandra, Chembur, age 24-55', status: 'completed', due: '2025-10-24', owner: 'Devika V.' },
        { id: 'p5-m1-t2', name: 'Cut the cinematic brand film into 15-second and 6-second bumper edits', status: 'completed', due: '2025-10-31', owner: 'Riya S.' },
        { id: 'p5-m1-t3', name: 'Launch Campaign 1 at ₹15,000 per month against the ₹85 CPM ceiling', status: 'completed', due: '2025-11-03', owner: 'Devika V.' },
        { id: 'p5-m1-t4', name: 'Split-test the 15s cutdowns against the bumper edit to hold CPM under ₹85', status: 'completed', due: '2026-01-16', owner: 'Devika V.' },
        { id: 'p5-m1-t5', name: 'Refresh awareness creative for the Month 6 Durga Puja pre-booking window', status: 'completed', due: '2026-03-20', owner: 'Priya N.' },
        { id: 'p5-m1-t6', name: 'Certify final Campaign 1 delivery at 196,500 monthly reach and ₹79 CPM', status: 'completed', due: '2026-08-31', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Cinematic brand film plus three 15-second cutdowns', status: 'Delivered', due: '2025-10-31', owner: 'Riya S.', dependency: 'Kitchen shoot access from Howrah Ops', priority: 'High' },
        { name: 'Campaign 1 suburb geofence and 24-55 audience build', status: 'Delivered', due: '2025-10-24', owner: 'Devika V.', dependency: '—', priority: 'High' },
        { name: 'Awareness flight close-out report (reach, CPM, frequency)', status: 'Delivered', due: '2026-08-31', owner: 'Aditya T.', dependency: 'GA4 and Meta Business Suite parity', priority: 'Medium' }
      ]
    },
    {
      id: 'p5-m2',
      name: 'Video Views',
      summary: 'Campaign 2 (The Sizzle Hook) at ₹12,000 a month: 15-second ASMR sizzle videos led by crispy Bhetki Fish Fry hitting hot mustard oil, served as 9:16 Reels and Stories to a broad Mumbai F&B audience and to Zomato and Swiggy food-delivery app users. Optimised on ThruPlay against a ₹0.35 cost ceiling and a 35,000 completion target.',
      owners: ['Devika V.', 'Riya S.'],
      priority: 'Medium',
      status: 'completed',
      start: '2025-11-03',
      end: '2026-09-12',
      expectedOutcome: 'Delivers 36,800 monthly video completions at ₹0.31 per ThruPlay, building the cheapest possible retargeting pool for the traffic and conversion campaigns.',
      dependencies: ['p3-m3', 'p3-m4'],
      metrics: {
        budget: '₹12,000 / mo',
        reach: 'Broad Mumbai F&B + delivery app users',
        leads: '35,000+ ThruPlay completions'
      },
      tasks: [
        { id: 'p5-m2-t1', name: 'Shoot the ASMR hero reel: crispy Bhetki Fish Fry hitting hot mustard oil', status: 'completed', due: '2025-11-07', owner: 'Riya S.' },
        { id: 'p5-m2-t2', name: 'Build the 9:16 Reels and Stories placement set for broad Mumbai F&B reach', status: 'completed', due: '2025-11-14', owner: 'Devika V.' },
        { id: 'p5-m2-t3', name: 'Layer Zomato and Swiggy delivery-app interest audiences into Campaign 2', status: 'completed', due: '2025-11-21', owner: 'Devika V.' },
        { id: 'p5-m2-t4', name: 'Launch Campaign 2 at ₹12,000 per month on a ₹0.35 cost-per-ThruPlay cap', status: 'completed', due: '2025-11-28', owner: 'Devika V.' },
        { id: 'p5-m2-t5', name: 'Scale the three best sizzle cutdowns in the Month 3 creative scaling review', status: 'completed', due: '2025-12-19', owner: 'Devika V.' },
        { id: 'p5-m2-t6', name: 'Certify 36,800 monthly ThruPlays at ₹0.31 against the 35,000 completion goal', status: 'completed', due: '2026-09-12', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'ASMR sizzle library (15s, 9:16) covering Fish Fry, Fish Chop and Kosha Mangsho', status: 'Delivered', due: '2026-01-30', owner: 'Riya S.', dependency: 'Tuesday and Friday kitchen shoot windows', priority: 'High' },
        { name: 'ThruPlay optimisation and placement configuration', status: 'Delivered', due: '2025-11-28', owner: 'Devika V.', dependency: '—', priority: 'Medium' },
        { name: 'Video-view custom audience feeding Campaigns 4, 6 and 7', status: 'Delivered', due: '2025-12-19', owner: 'Aditya T.', dependency: 'Meta CAPI event stream', priority: 'High' }
      ]
    },
    {
      id: 'p5-m3',
      name: 'Engagement',
      summary: 'Campaign 3 (Community & Cultural Engagement) at ₹8,000 a month: image polls and carousels built on the cultural debate "Does authentic Kolkata Biryani require a potato? Have your say!", targeted at Bengali diaspora groups in Mumbai and Durga Puja cultural committees against a ₹1.10 cost-per-engagement cap and a 7,500 comment-and-share target.',
      owners: ['Devika V.', 'Priya N.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2025-12-01',
      end: '2026-09-30',
      expectedOutcome: 'Converts community sentiment into owned audience depth, supplying the society and cultural-committee relationships that the catering lead engine converts.',
      dependencies: ['p3-m5'],
      metrics: {
        budget: '₹8,000 / mo',
        reach: 'Bengali diaspora + Puja committees',
        leads: '7,500+ comments & shares'
      },
      tasks: [
        { id: 'p5-m3-t1', name: 'Build the Bengali diaspora and Durga Puja committee audience for Campaign 3', status: 'completed', due: '2025-12-05', owner: 'Devika V.' },
        { id: 'p5-m3-t2', name: 'Ship the poll creative on whether Kolkata Biryani requires a potato', status: 'completed', due: '2025-12-12', owner: 'Priya N.' },
        { id: 'p5-m3-t3', name: 'Launch Campaign 3 at ₹8,000 per month against the ₹1.10 engagement cap', status: 'completed', due: '2025-12-19', owner: 'Devika V.' },
        { id: 'p5-m3-t4', name: 'Run the Month 6 Puja committee engagement burst with festive poll cards', status: 'completed', due: '2026-03-27', owner: 'Devika V.' },
        { id: 'p5-m3-t5', name: 'Moderate comment threads daily and route order intent to the WhatsApp desk', status: 'in-progress', due: '2026-09-30', owner: 'Priya N.' },
        { id: 'p5-m3-t6', name: 'Close the year at 7,500+ comments and shares with a sentiment read-out', status: 'in-progress', due: '2026-09-30', owner: 'Devika V.' }
      ],
      deliverables: [
        { name: 'Cultural poll and carousel creative set (12 variants)', status: 'Delivered', due: '2026-03-27', owner: 'Priya N.', dependency: '—', priority: 'Medium' },
        { name: 'Comment moderation and escalation playbook for community threads', status: 'In Progress', due: '2026-09-30', owner: 'Priya N.', dependency: 'Howrah Ops response rota', priority: 'Medium' },
        { name: 'Engagement close-out: comments, shares and cost per engagement', status: 'In Progress', due: '2026-09-30', owner: 'Devika V.', dependency: '—', priority: 'Low' }
      ]
    },
    {
      id: 'p5-m4',
      name: 'Traffic',
      summary: 'Campaign 4 (Daily Meal Office Traffic) at ₹22,000 a month: a multi-card carousel of five daily tiffin options priced from ₹180, geofenced to working professionals within 5 km of Powai and Andheri covering MIDC, SEEPZ and BKC. Optimised for menu views against a ₹6.20 CPC ceiling, 3,500+ monthly menu visits and 150+ tiffin trials.',
      owners: ['Devika V.', 'Rahul K.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-11-10',
      end: '2026-09-30',
      expectedOutcome: 'Feeds the tiffin subscription funnel with 3,500+ qualified menu visits a month and the trial volume needed to reach 250 active daily subscribers.',
      dependencies: ['p1-m5', 'p2-m8'],
      metrics: {
        budget: '₹22,000 / mo',
        reach: '5 km Powai / Andheri (MIDC, SEEPZ, BKC)',
        leads: '3,500+ menu visits | 150+ trials'
      },
      tasks: [
        { id: 'p5-m4-t1', name: 'Geofence Campaign 4 to 5 km of Powai and Andheri covering MIDC, SEEPZ and BKC', status: 'completed', due: '2025-11-14', owner: 'Devika V.' },
        { id: 'p5-m4-t2', name: 'Build the multi-card carousel of five daily tiffin options priced from ₹180', status: 'completed', due: '2025-11-21', owner: 'Riya S.' },
        { id: 'p5-m4-t3', name: 'Launch Campaign 4 at ₹22,000 per month against the ₹6.20 CPC ceiling', status: 'completed', due: '2025-11-28', owner: 'Devika V.' },
        { id: 'p5-m4-t4', name: 'Wire menu-view and trial-signup events through GTM and the Meta CAPI feed', status: 'completed', due: '2025-12-12', owner: 'Rahul K.' },
        { id: 'p5-m4-t5', name: 'Rotate carousel cards to the Chilli Chicken Dry and Egg Fried Rice desk pair', status: 'completed', due: '2026-05-29', owner: 'Priya N.' },
        { id: 'p5-m4-t6', name: 'Run the Month 11 discounted 1-week tiffin trial offer to push trials past 150', status: 'in-progress', due: '2026-08-31', owner: 'Devika V.' },
        { id: 'p5-m4-t7', name: 'Hold CPC under ₹6.20 while scaling toward 3,500 monthly menu visits', status: 'in-progress', due: '2026-09-30', owner: 'Devika V.' }
      ],
      deliverables: [
        { name: 'Five-card daily tiffin carousel with ₹180 entry price tags', status: 'Delivered', due: '2025-11-21', owner: 'Riya S.', dependency: 'Menu pricing sign-off from Howrah Ops', priority: 'Critical' },
        { name: 'Menu-view and trial event tracking through GTM and Meta CAPI', status: 'Delivered', due: '2025-12-12', owner: 'Rahul K.', dependency: 'Client staging and GTM container access', priority: 'Critical' },
        { name: 'Month 11 one-week tiffin trial offer package', status: 'In Review', due: '2026-09-22', owner: 'Devika V.', dependency: 'Kitchen capacity confirmation', priority: 'High' },
        { name: 'CPC and menu-visit performance dashboard', status: 'In Progress', due: '2026-09-30', owner: 'Aditya T.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p5-m5',
      name: 'Lead Generation',
      summary: 'Campaign 5 (Catering & Society Event Lead Gen) at ₹25,000 a month, the largest line in the Meta budget: an Instant Form offering "Planning an Office Party? Download 2026 Catering Pricing Guide", served with supporting video to corporate event planners, HR administrators and engaged couples in Powai. Target is 110+ qualified catering leads at a cost per lead below ₹230.',
      owners: ['Devika V.', 'Nikhil C.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2026-03-02',
      end: '2026-09-30',
      expectedOutcome: 'Supplies the catering pipeline with 110+ qualified leads a month at under ₹230 each, underpinning the 25 booked events per month in the Month 12 run-rate model.',
      dependencies: ['p2-m8', 'p1-m6'],
      metrics: {
        budget: '₹25,000 / mo',
        reach: 'Event planners, HR admins, Powai couples',
        leads: '110+ qualified catering leads'
      },
      tasks: [
        { id: 'p5-m5-t1', name: 'Build the Instant Form for the 2026 Catering Pricing Guide download', status: 'completed', due: '2026-03-06', owner: 'Priya N.' },
        { id: 'p5-m5-t2', name: 'Target corporate event planners, HR administrators and engaged couples in Powai', status: 'completed', due: '2026-03-13', owner: 'Devika V.' },
        { id: 'p5-m5-t3', name: 'Launch Campaign 5 at ₹25,000 per month against the ₹230 cost-per-lead cap', status: 'completed', due: '2026-03-20', owner: 'Devika V.' },
        { id: 'p5-m5-t4', name: 'Raise Meta spend 40% for the Month 6 festive banquet pre-order lead push', status: 'completed', due: '2026-03-31', owner: 'Devika V.' },
        { id: 'p5-m5-t5', name: 'Sync form submissions into the WhatsApp Business API CRM within 15 minutes', status: 'completed', due: '2026-05-22', owner: 'Aditya T.' },
        { id: 'p5-m5-t6', name: 'Clear the September qualification backlog to certify 110+ qualified leads', status: 'in-progress', due: '2026-09-12', owner: 'Arjun M.' },
        { id: 'p5-m5-t7', name: 'Hold cost per lead under ₹230 through the Month 12 corporate contract push', status: 'in-progress', due: '2026-09-30', owner: 'Devika V.' }
      ],
      deliverables: [
        { name: '2026 Catering Pricing Guide and Instant Form build', status: 'Delivered', due: '2026-03-06', owner: 'Priya N.', dependency: 'Client pricing approval', priority: 'Critical' },
        { name: 'Lead-to-CRM sync via the WhatsApp Business API', status: 'Delivered', due: '2026-05-22', owner: 'Aditya T.', dependency: 'WhatsApp Business API credentials', priority: 'Critical' },
        { name: 'Lead qualification scorecard and September backlog clearance', status: 'In Progress', due: '2026-09-25', owner: 'Arjun M.', dependency: 'Client sales-team callback capacity', priority: 'High' },
        { name: 'Cost-per-lead and lead-quality monthly report', status: 'In Progress', due: '2026-09-30', owner: 'Devika V.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p5-m6',
      name: 'WhatsApp Leads',
      summary: 'Campaign 6 (Click-to-WhatsApp Direct Ordering) at ₹20,000 a month: WhatsApp click ads carrying "Craving Authentic Bengali Lunch Today? Chat directly with chef", held to a strict 3-5 km radius around the Powai hub covering Emerald Isle and Godrej Platinum. Optimised for conversions against a ₹16 cost-per-chat ceiling and 1,250+ direct chats a month.',
      owners: ['Devika V.', 'Howrah Ops'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2026-01-12',
      end: '2026-09-30',
      expectedOutcome: 'Drives 1,250+ commission-free direct chats a month from the catchment that already produces 55.3% of audited sales, bypassing Swiggy and Zomato margin loss.',
      dependencies: ['p1-m4', 'p5-m4'],
      metrics: {
        budget: '₹20,000 / mo',
        reach: '3-5 km Powai hub radius',
        leads: '1,250+ direct chats'
      },
      tasks: [
        { id: 'p5-m6-t1', name: 'Set the strict 3-5 km Powai geofence over Emerald Isle and Godrej Platinum', status: 'completed', due: '2026-01-16', owner: 'Devika V.' },
        { id: 'p5-m6-t2', name: 'Ship the chat-with-the-chef hook creative for the lunch ordering window', status: 'completed', due: '2026-01-23', owner: 'Priya N.' },
        { id: 'p5-m6-t3', name: 'Launch Campaign 6 at ₹20,000 per month against the ₹16 cost-per-chat cap', status: 'completed', due: '2026-01-30', owner: 'Devika V.' },
        { id: 'p5-m6-t4', name: 'Deep-link chats into the 1-Click WhatsApp Order flow prefilled with the dish', status: 'completed', due: '2026-02-27', owner: 'Rahul K.' },
        { id: 'p5-m6-t5', name: 'Staff a 12-hour WhatsApp response rota with Howrah Ops across the festive peak', status: 'completed', due: '2026-04-24', owner: 'Howrah Ops' },
        { id: 'p5-m6-t6', name: 'Extend the chat geofence to Kanjurmarg East and Lake Homes at 3 km', status: 'in-progress', due: '2026-09-25', owner: 'Devika V.' },
        { id: 'p5-m6-t7', name: 'Lift chats from 1,180 to the 1,250 monthly target at under ₹16 per chat', status: 'in-progress', due: '2026-09-30', owner: 'Devika V.' }
      ],
      deliverables: [
        { name: 'Click-to-WhatsApp ad set on the Powai 3-5 km geofence', status: 'Delivered', due: '2026-01-30', owner: 'Devika V.', dependency: 'WhatsApp Business number verification', priority: 'Critical' },
        { name: 'Prefilled 1-Click WhatsApp Order deep-link generator', status: 'Delivered', due: '2026-02-27', owner: 'Rahul K.', dependency: 'Website menu template release', priority: 'Critical' },
        { name: '12-hour response rota and chat-handling script for Howrah Ops', status: 'Delivered', due: '2026-04-24', owner: 'Howrah Ops', dependency: 'Kitchen staffing roster', priority: 'High' },
        { name: 'Kanjurmarg East and Lake Homes geofence expansion plan', status: 'In Review', due: '2026-09-25', owner: 'Devika V.', dependency: 'Delivery radius confirmation', priority: 'Medium' }
      ]
    },
    {
      id: 'p5-m7',
      name: 'Retargeting',
      summary: 'Campaign 7 (Dynamic Cart & Lapsed Retargeting) at ₹18,000 a month: a dynamic product carousel carrying the urgency line "Still Craving Kosha Mangsho? Enjoy Flat 20% OFF code: BRIDGE20", served to website visitors from the last 30 days plus the uploaded custom list of 77 dormant regulars. Target is a ROAS above 4.5x and reactivation of at least 25 dormant regulars.',
      owners: ['Devika V.', 'Aditya T.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-12-08',
      end: '2026-09-30',
      expectedOutcome: 'Recovers dormant lifetime value from a cohort worth ₹6.9L in lapsed revenue while holding the highest return in the Meta mix at above 4.5x ROAS.',
      dependencies: ['p1-m5', 'p5-m2'],
      metrics: {
        budget: '₹18,000 / mo',
        reach: '30-day visitors + 77 dormant regulars',
        leads: 'ROAS > 4.5x | 25+ reactivated'
      },
      tasks: [
        { id: 'p5-m7-t1', name: 'Upload the 77 dormant regulars as a hashed custom audience with lookalike seed', status: 'completed', due: '2025-12-12', owner: 'Aditya T.' },
        { id: 'p5-m7-t2', name: 'Build 30-day site-visitor and cart-abandoner audiences from the CAPI feed', status: 'completed', due: '2025-12-19', owner: 'Rahul K.' },
        { id: 'p5-m7-t3', name: 'Ship the BRIDGE20 dynamic Kosha Mangsho urgency carousel', status: 'completed', due: '2025-12-26', owner: 'Riya S.' },
        { id: 'p5-m7-t4', name: 'Launch Campaign 7 at ₹18,000 per month against the 4.5x target ROAS', status: 'completed', due: '2025-12-31', owner: 'Devika V.' },
        { id: 'p5-m7-t5', name: 'Reactivate the remaining dormant regulars on the WELCOMEBACK win-back code', status: 'in-progress', due: '2026-09-12', owner: 'Devika V.' },
        { id: 'p5-m7-t6', name: 'Hold ROAS above 4.5x while the Month 12 spring menu carousel runs', status: 'in-progress', due: '2026-09-30', owner: 'Devika V.' },
        { id: 'p5-m7-t7', name: 'Hand the audience architecture to Howrah Ops for the FY27 renewal', status: 'not-started', due: '2026-09-30', owner: 'Arjun M.' }
      ],
      deliverables: [
        { name: 'Dormant-regular custom audience and 1% lookalike seed', status: 'Delivered', due: '2025-12-12', owner: 'Aditya T.', dependency: 'Customer list export from client CRM', priority: 'High' },
        { name: 'BRIDGE20 dynamic product carousel and catalogue feed', status: 'Delivered', due: '2025-12-26', owner: 'Riya S.', dependency: 'Product catalogue completeness', priority: 'High' },
        { name: 'Dormant reactivation tracker against the 25-customer target', status: 'In Progress', due: '2026-09-25', owner: 'Devika V.', dependency: '—', priority: 'High' },
        { name: 'FY27 retargeting audience handover pack', status: 'Pending', due: '2026-09-30', owner: 'Arjun M.', dependency: 'Client ad account ownership transfer', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R5.1',
      risk: 'iOS App Tracking Transparency signal loss degrades the 30-day visitor and cart-abandoner audiences that Campaign 7 depends on, understating measured ROAS against the 4.5x target.',
      impact: 'High', probability: 'Medium', owner: 'Rahul K.',
      mitigation: 'Meta CAPI server-side events were installed in Month 1 alongside GTM; event match quality is reviewed weekly and modelled conversions are reconciled monthly against direct checkout revenue in GA4.',
      status: 'Mitigating' },
    { id: 'R5.2',
      risk: 'Instant Form leads from Campaign 5 convert at a lower rate than gated downloads: HR administrators request the pricing guide without event intent, inflating volume while diluting the qualified count against the 110-lead target.',
      impact: 'High', probability: 'Medium', owner: 'Devika V.',
      mitigation: 'The form runs in higher-intent mode with an event-date and headcount qualifier, and every submission is scored in the WhatsApp CRM within 15 minutes; only scored leads count toward the 110 target.',
      status: 'Mitigating' },
    { id: 'R5.3',
      risk: 'Budget concentration: ₹45,000 of the ₹1,20,000 monthly spend (37.5%) sits in Campaigns 5 and 6, so any ad account restriction on lead forms or WhatsApp click ads stalls most of the paid pipeline at once.',
      impact: 'Critical', probability: 'Low', owner: 'Arjun M.',
      mitigation: 'A second verified business manager and backup payment method are held in reserve; Campaign 4 traffic creative is pre-approved so spend can be redirected to menu visits within 24 hours.',
      status: 'Monitoring' },
    { id: 'R5.4',
      risk: 'Creative fatigue inside the strict 3-5 km Powai geofence drives frequency up and pushes cost per chat above the ₹16 ceiling within four to six weeks of a flight.',
      impact: 'Medium', probability: 'High', owner: 'Devika V.',
      mitigation: 'Two fixed weekly shoot windows with Howrah Ops keep a four-week buffer of fresh sizzle cutdowns; creative rotates on a frequency trigger of 2.8 and the geofence is being widened to Kanjurmarg East and Lake Homes.',
      status: 'Mitigating' },
    { id: 'R5.5',
      risk: 'The Campaign 3 cultural poll on whether Kolkata Biryani requires a potato can turn adversarial inside Durga Puja committee groups and attach negative sentiment to the brand at the festive peak.',
      impact: 'Medium', probability: 'Medium', owner: 'Priya N.',
      mitigation: 'A moderation and escalation playbook governs the threads, hidden-word lists are enforced, and order intent in comments is routed to the WhatsApp desk rather than debated in public.',
      status: 'Monitoring' },
    { id: 'R5.6',
      risk: 'Campaign 4 trial volume and Campaign 6 chat volume can outrun kitchen fulfilment capacity during festive weeks, converting paid demand into delivery delays and negative reviews.',
      impact: 'High', probability: 'Medium', owner: 'Howrah Ops',
      mitigation: 'Daily order caps are set per ad set and dayparting holds the lunch window to verified kitchen throughput; the Month 11 trial offer was gated to a capacity confirmation before release.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Campaign 1 monthly reach', baseline: '—', target: '180,000+', current: '196,500', unit: '', direction: 'up' },
    { label: 'Cost per ThruPlay (Campaign 2)', baseline: '—', target: '< ₹0.35', current: '₹0.31', unit: '', direction: 'down' },
    { label: 'Cost per qualified catering lead (Campaign 5)', baseline: '—', target: '< ₹230', current: '₹214', unit: '', direction: 'down' },
    { label: 'Monthly qualified catering leads', baseline: '~8', target: '160+', current: '148', unit: '', direction: 'up' },
    { label: 'Monthly Click-to-WhatsApp chats (Campaign 6)', baseline: '—', target: '1,250+', current: '1,180', unit: '', direction: 'up' },
    { label: 'Blended paid advertising ROAS', baseline: '~1.8x', target: '4.2x+', current: '4.1x', unit: '', direction: 'up' }
  ],
  notes: 'Campaign names, funnel objectives, geofences, creative hooks, ad formats, monthly budgets and KPI ceilings are taken verbatim from the Phase 6 Meta Ads Plan; the seven modules map 1:1 onto Campaigns 1 to 7 and their budgets sum to the stated ₹1,20,000 monthly total. Launch sequencing follows the Phase 10 roadmap — awareness in Month 1, ASMR video and office traffic in Month 2, dynamic retargeting in Month 3, WhatsApp order ads in Month 4 and the festive lead-form scale-up in Month 6. Phase health is green: six of seven KPI ceilings are being met, with three delivery items slipped into the final fortnight.'
});
