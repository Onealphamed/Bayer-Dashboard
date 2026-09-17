/* Business Intelligence — audited empirical baseline
   source sheets: "Exec Summary & Audit Data", "Menu & Basket Analytics", "Phase 2 - Competitor Analysis" */
PMO.registerIntel({

  headline: {
    title: 'Audited Historical KPI Baseline',
    subtitle: 'Empirical diagnostic of 1,405 orders and 255 unique buyers taken from the live order ' +
      'dashboard — the evidence base from which all nine programme phases, budgets and creative ' +
      'directives were derived.',
    source: 'Live order dashboard, Apr 2025 – Sep 2026'
  },

  /* ---- 8 headline tiles (Exec Summary — Audited Historical KPI Baseline row) ---- */
  baseline: [
    { label: 'Net Sales (18 mo)',   value: '₹24,60,000',   raw: 2460000 },
    { label: 'Total Orders',        value: '1,405',        raw: 1405 },
    { label: 'Unique Buyers',       value: '255',          raw: 255 },
    { label: 'Average Basket',      value: '₹1,751',       raw: 1751 },
    { label: 'Sales From Regulars', value: '87%',          raw: 87 },
    { label: 'Regular LTV',         value: '₹14,507',      raw: 14507 },
    { label: 'Emerald Isle Share',  value: '55.3%',        raw: 55.3 },
    { label: '77 Dormant Regulars', value: '₹11.16L LTV',  raw: 1116000 }
  ],

  /* ---- Exec Summary §1 — Geographic Concentration & Turf Audit (8 rows) ---- */
  geoClusters: [
    { cluster: 'Emerald Isle Campus (Powai)', sales: 1360000, sharePct: 55.3,
      action: 'Home turf anchor (55.3% sales). Deploy zero-cost society WhatsApp broadcasts and doorstep flyers.',
      phase: 'p4' },
    { cluster: 'Location Not Recorded (Data Gap)', sales: 131000, sharePct: 5.3,
      action: 'Mandate address and postal code capture on website checkout and WhatsApp CRM.',
      phase: 'p8' },
    { cluster: 'Kanjurmarg East', sales: 74441, sharePct: 3,
      action: 'High-density residential expansion corridor. Target via localized 3km Meta delivery ads.',
      phase: 'p5' },
    { cluster: 'Godrej Platinum (Vikhroli)', sales: 67825, sharePct: 2.8,
      action: 'Luxury gated high-rise complex. Focus on high-AOV weekend family banquet promotions.',
      phase: 'p5' },
    { cluster: 'Lake Homes (Powai)', sales: 47263, sharePct: 1.9,
      action: 'Adjacent Powai complex. Target via society Bengali cultural committee partnerships.',
      phase: 'p7' },
    { cluster: 'Castle Rock (Hiranandani Powai)', sales: 43599, sharePct: 1.8,
      action: 'Affluent demographic. Promote premium seafood (Ilish, Bhetki) and catering platters.',
      phase: 'p3' },
    { cluster: 'Wadala', sales: 40479, sharePct: 1.6,
      action: 'Long-distance cluster (Bhakti Park / Lodha). Target for scheduled weekend bulk orders.',
      phase: 'p6' },
    { cluster: 'Malad West', sales: 40125, sharePct: 1.6,
      action: 'Western suburb pocket. Focus on high-ticket weekend feasts and festival catering boxes.',
      phase: 'p4' }
  ],

  /* ---- Exec Summary §2 — Customer loyalty bands by order count (6 rows) ---- */
  loyaltyBands: [
    { band: '1 Order (One-Time Buyers)', customers: 108, revenue: 325000, sharePct: 13.2,
      intervention: "Lost acquisition. Deploy automated 7-day post-purchase WhatsApp incentive ('20% OFF 2nd Order')." },
    { band: '2 Orders (Early Repeaters)', customers: 42, revenue: 282000, sharePct: 11.5,
      intervention: 'Cross-sell top affinity pairings (Basanti Pulao + Kosha Mangsho).' },
    { band: '3 – 4 Orders (Developing)', customers: 30, revenue: 226000, sharePct: 9.2,
      intervention: 'Introduce 5-day and 20-day office lunch subscription packages.' },
    { band: '5 – 9 Orders (Core Regulars)', customers: 37, revenue: 341000, sharePct: 13.9,
      intervention: "Enroll in 'Howrah Bridge Loyalty Club' with free dessert on orders >₹800." },
    { band: '10 – 19 Orders (Power Buyers)', customers: 23, revenue: 460000, sharePct: 18.7,
      intervention: 'VIP concierge ordering via direct WhatsApp manager; early festival pre-booking.' },
    { band: '20+ Orders (Mega Loyalists)', customers: 15, revenue: 824000, sharePct: 33.5,
      intervention: 'Top 15 drive 33.5% of sales! Personalized gift hampers on Pujo; direct founder contact.' }
  ],

  /* ---- Exec Summary §2 — recency subsets: the 147 repeat buyers, 77 of them dormant ---- */
  recencyCohorts: [
    { cohort: 'Active Regulars (<60 days)', customers: 70, revenue: 1420000, sharePct: 57.7,
      status: 'Healthy',
      intervention: 'Healthy active base driving recent 86% returning share. Maintain Friday menus.' },
    { cohort: 'Regulars Going Quiet (60-150d)', customers: 36, revenue: 420000, sharePct: 17.1,
      status: 'At Risk',
      intervention: "AT RISK. Trigger automated WhatsApp voucher: 'Free Mishti on orders >₹600'." },
    { cohort: 'Lapsed Regulars (150+ days)', customers: 41, revenue: 690000, sharePct: 28,
      status: 'Lapsed',
      intervention: "DORMANT LTV. Deploy VIP win-back code 'WELCOMEBACK' for Flat 20% OFF." }
  ],

  /* ---- Menu sheet §1 — Audited revenue by category (10 rows) ---- */
  menuCategories: [
    { category: 'Fish & Seafood', sales: 470000, sharePct: 19.1, dishes: 48,
      strategy: 'Largest à-la-carte engine. Fish Fry alone ₹66,309 (368 portions, 92% regulars). Anchor hook for Bengalis.' },
    { category: 'Catering / Party Menus', sales: 467000, sharePct: 19, dishes: 41,
      strategy: 'High-margin event spikes. Only 41 line items out of 3,525 generate 19% of item revenue (Poila Boishakh/Ilish).' },
    { category: 'Chicken Mains', sales: 440000, sharePct: 17.9, dishes: 62,
      strategy: 'Core daily weekday volume. Chicken Cutlet ₹49,403 from 456 portions; steady office lunch driver.' },
    { category: 'Vegetarian Mains', sales: 240000, sharePct: 9.8, dishes: 55,
      strategy: 'Essential thali companions. Shukto is #1 ordered dish across entire kitchen (136 orders, 66 buyers).' },
    { category: 'Other / Fusion / Specials', sales: 230000, sharePct: 9.3, dishes: 72,
      strategy: 'Kolkata Tangra Indo-Chinese and seasonal festive specials.' },
    { category: 'Mutton Curries', sales: 210000, sharePct: 8.5, dishes: 24,
      strategy: 'High AOV weekend feast driver. Kosha Mangsho ₹49,585 from 86 portions (₹550 price point).' },
    { category: 'Sweets & Desserts', sales: 140000, sharePct: 5.7, dishes: 35,
      strategy: 'High-margin impulse add-on. Taaler Malpoa, Rosogollar Payesh, Mishti Doi.' },
    { category: 'Rice & Breads', sales: 115000, sharePct: 4.7, dishes: 28,
      strategy: 'Basanti Pulao, Luchi, Kochuri, Steamed Gobindobhog Rice.' },
    { category: 'Snacks & Starters', sales: 110000, sharePct: 4.5, dishes: 38,
      strategy: 'Fish Chop ₹53,692 (669 portions sold); Chicken Croquette, Vegetable Chop.' },
    { category: 'Egg Preparations', sales: 43005, sharePct: 1.7, dishes: 12,
      strategy: 'Dimer Dalna, Egg Rolls, Egg Devil.' }
  ],

  /* ---- Menu sheet §2 — the repeat-hook dishes mandatory in cold acquisition ads (10 rows) ---- */
  repeatHooks: [
    { dish: 'Doodh Katla', firstOrders: 6, repeatPct: 100,
      directive: '100% Conversion! Feature in Meta Top-of-Funnel carousel as the authentic Sunday fish curry.' },
    { dish: 'Postor Dum', firstOrders: 6, repeatPct: 100,
      directive: '100% Conversion! Target vegetarian Bengali families as an authentic specialty impossible to cook at home.' },
    { dish: 'Chilli Chicken Dry', firstOrders: 5, repeatPct: 100,
      directive: '100% Conversion! Hook corporate office bachelors and young couples in Powai/SEEPZ.' },
    { dish: 'Shorshe Chicken', firstOrders: 5, repeatPct: 100,
      directive: '100% Conversion! Unique regional mustard gravy; feature in 15-sec sizzle video ads.' },
    { dish: 'Posto Chicken', firstOrders: 4, repeatPct: 100,
      directive: '100% Conversion! High-retention hero dish; promote in mid-week lunch sets.' },
    { dish: 'Phulkopir Roast', firstOrders: 4, repeatPct: 100,
      directive: '100% Conversion! Winter/festive classic vegetarian delight; ideal catering starter.' },
    { dish: 'Egg Fried Rice', firstOrders: 4, repeatPct: 100,
      directive: '100% Conversion! Pair with Chilli Chicken for corporate lunch desk delivery.' },
    { dish: 'Chhanar Kofta Pulao', firstOrders: 4, repeatPct: 100,
      directive: '100% Conversion! Premium vegetarian main; key for wedding/reception catering menus.' },
    { dish: 'Chicken Croquette', firstOrders: 6, repeatPct: 83.3,
      directive: '83.3% Conversion! Evening snack hook; promote during 4:30 PM - 7:00 PM tea time.' },
    { dish: 'Mutton Kosha', firstOrders: 5, repeatPct: 80,
      directive: '80.0% Conversion! High AOV driver (₹550); weekend family dinner centerpiece.' }
  ],

  /* ---- Menu sheet §3 — empirical basket pairings (9 rows) ---- */
  basketPairings: [
    { pair: 'Taaler Bora + Taaler Malpoa', coOrders: 18,
      bundle: 'Janmashtami & Monsoon Twin Sweet Box',
      slot: 'Evening Snack / Dessert', aov: 380 },
    { pair: 'Fish Chop + Vegetable Chop', coOrders: 16,
      bundle: 'Kolkata Street Snack Duet (Crispy Starters)',
      slot: 'Evening Tea (4:30 PM – 7:00 PM)', aov: 240 },
    { pair: 'Chicken Roll + Egg Roll', coOrders: 16,
      bundle: 'Kolkata Midnight/Office Roll Combo',
      slot: 'Lunch & Late Night Quick Bite', aov: 320 },
    { pair: 'Basanti Pulao + Kosha Mangsho', coOrders: 13,
      bundle: 'The Royal Kolkata Sunday Bhoj (Flagship Combo)',
      slot: 'Sunday Lunch & Dinner Family Gatherings', aov: 850 },
    { pair: 'Potoler Dolma + Shukto', coOrders: 13,
      bundle: 'Traditional Niramish (Veg) Gourmet Feast',
      slot: "Weekday Family Lunch & Elders' Comfort", aov: 480 },
    { pair: 'Shukto + Vegetable Chop', coOrders: 12,
      bundle: 'Classic Bengali Vegetarian Thali Combo',
      slot: 'Midweek Healthy Lunch (Shukto in 136 orders!)', aov: 320 },
    { pair: 'Chal Potol + Shukto', coOrders: 11,
      bundle: 'Heritage Bengali Vegetarian Lunch Platter',
      slot: 'Traditional Home Comfort Meal', aov: 450 },
    { pair: 'Doodh Katla + Shukto', coOrders: 11,
      bundle: 'Authentic Sunday Fish & Shukto Thali',
      slot: 'Weekend Family Feast (100% Repeat Hook)', aov: 580 },
    { pair: 'Chilli Chicken Dry + Egg Fried Rice', coOrders: 11,
      bundle: 'Tangra Kolkata Indo-Chinese Corporate Combo',
      slot: 'Corporate Lunch Desks in Powai & SEEPZ', aov: 420 }
  ],

  /* ---- Phase 2 sheet — Mumbai competitive landscape & market gap analysis (5 rows) ---- */
  competitors: [
    { name: 'Bhojohori Manna',
      model: 'Legacy Dine-in & Delivery (Powai / Bandra West)',
      seo: "High Domain Rating (DR 42+). Ranks top-3 for generic 'Bengali restaurant Mumbai' and 'Bengali food Powai'.",
      local: 'Established GBP profile (4.1★, 1,200+ reviews). Suffers from recent complaints regarding delivery packaging.',
      social: 'Minimal organic social activity. Zero active Meta Ads library campaigns. Dormant Instagram presence.',
      vulnerabilities: 'Slow response to corporate catering RFPs; high dine-in overhead reflected in steep delivery prices; zero daily tiffin focus.',
      attack: 'Target corporate lunch boxes and daily tiffin subscribers in Powai/Andheri; offer 20% lower pricing with fresh cloud delivery.',
      threat: 'High' },
    { name: "Hangla's",
      model: 'Quick Service Kolkata Street Food & Rolls Chain',
      seo: 'Moderate local SEO. Heavy reliance on Swiggy and Zomato aggregator listings; weak standalone website.',
      local: 'Multiple local listings across Mumbai suburbs; low review velocity; unoptimized service categories.',
      social: 'Strong youth appeal around Kolkata rolls and biryani; reactive social media; seasonal meme marketing.',
      vulnerabilities: 'Positioned strictly as fast food/snacks; completely incapable of catering royal sit-down wedding buffets or executive thalis.',
      attack: "Dominate authentic slow-cooked traditional dishes (Kosha Mangsho, Shukto, Fish Kalia) where Hangla's cannot compete.",
      threat: 'Medium' },
    { name: 'Oh! Calcutta (Speciality)',
      model: 'Fine Dine Luxury Bengali Heritage (Andheri / Tardeo)',
      seo: 'Very high direct brand search; ranks on national authoritative publications for Bengali dining in India.',
      local: 'Dominates 5-star fine-dining Google Maps results in Western Suburbs and South Mumbai.',
      social: 'Polished corporate social presence; runs sporadic high-budget brand awareness campaigns during Durga Puja.',
      vulnerabilities: 'Prohibitive luxury pricing (₹1,800+ per person); inaccessible for daily office meals or mid-sized private house parties (<50 pax).',
      attack: 'Capture mid-market private catering (20-100 pax) with customized per-plate packages starting at ₹700–₹1,000.',
      threat: 'Low' },
    { name: 'Box8 / Rebel Foods (Faasos/Behrouz)',
      model: 'Mass Scaled Cloud Kitchens & Corporate Meal Boxers',
      seo: "Massive programmatic SEO footprint for 'food delivery', 'meal subscription', and 'order lunch online'.",
      local: 'Scores of cloud hub listings; heavily algorithmically managed; automated customer review systems.',
      social: 'Aggressive performance marketing; 50+ active Meta ad variations; high discount CAC burn model.',
      vulnerabilities: 'Completely generic pan-Indian/continental menu; zero regional authenticity; frozen re-heated ingredients.',
      attack: 'Position as the fresh, home-cooked regional alternative with zero preservatives and authentic mustard/poppy-seed heritage.',
      threat: 'High' },
    { name: 'Local Powai Dabba / Tiffin Vendors',
      model: 'Unorganized Hyper-Local Tiffin Services',
      seo: 'Virtually zero website or SEO footprint; relies on WhatsApp groups and word of mouth in Emerald Isle.',
      local: 'No Google Business Profile or unverified local pins; zero digital review tracking.',
      social: 'Zero social media or paid ad presence; strictly offline and localized word of mouth.',
      vulnerabilities: 'Lack of hygiene certifications (FSSAI); repetitive menu; erratic delivery timings; poor packaging.',
      attack: 'Offer FSSAI-certified, vacuum-sealed daily meals with varied weekly menus, punctual dispatch, and online billing.',
      threat: 'Medium' }
  ],

  /* ---- Consultant read-through: what the audit obliges the programme to do ---- */
  insights: [
    { title: '15 mega-loyalists carry 33.5% of revenue',
      detail: '15 of the 255 unique buyers (5.9%) placed 20 or more orders and generated ₹8,24,000 of the ' +
        '₹24,60,000 audited base. Add the 23 power buyers in the 10–19 band and 38 customers account for ' +
        '52.2% of all sales, at an average of ₹54,933 lifetime value in the top band alone.',
      implication: 'Concentration this steep makes retention, not reach, the primary growth lever. Phase 5 ' +
        'Campaign 7 (₹18,000/mo dynamic retargeting, target ROAS > 4.5x) and the VIP concierge WhatsApp ' +
        'line exist to defend ₹12,84,000 of proven revenue before any rupee is committed to cold traffic.',
      phase: 'p5' },

    { title: '55.3% of audited sales sit inside one Powai campus',
      detail: 'Emerald Isle Campus delivered ₹13,60,000 on its own. The other seven rows total ₹4,44,732 ' +
        'combined, and the three adjacent Powai/Vikhroli complexes — Godrej Platinum, Lake Homes and ' +
        'Castle Rock — contribute ₹1,58,687 between them.',
      implication: 'Phase 4 geofences 10 postal clusters, but the commercial priority is defending 400076 ' +
        'first: society WhatsApp broadcasts and doorstep flyers carry near-zero acquisition cost against ' +
        'demand that is already proven. Kanjurmarg East and Malad West stay funded as paid-media tests, ' +
        'not as standing budget lines.',
      phase: 'p4' },

    { title: '108 one-time buyers are 42% of the base but 13.2% of revenue',
      detail: '108 of 255 buyers never placed a second order, contributing ₹3,25,000. Average lifetime ' +
        'value rises from ₹3,009 at one order to ₹6,714 at two — the widest single step in the cohort ' +
        'table, and the cheapest one to engineer.',
      implication: 'Phase 8 owns the mechanism: the 1-click WhatsApp order button beside Fish Fry and ' +
        'Kosha Mangsho (+85% projected direct order rate) and the automated 7-day post-purchase 20% OFF ' +
        'incentive. Moving 20 of the 108 into the two-order band is worth roughly ₹74,000 at the observed ' +
        '₹3,705 per-buyer uplift.',
      phase: 'p8' },

    { title: '41 catering line items generate 19% of all revenue',
      detail: 'Catering and party menus produced ₹4,67,000 from only 41 line items out of 3,525 — by far ' +
        'the highest revenue density on the menu, set against 48 distinct Fish & Seafood dishes for ' +
        '₹4,70,000. The two engines together are 38.1% of audited sales.',
      implication: 'Phase 6 concentrates ₹75,000 a month on corporate (₹30,000, target CPA ₹450), wedding ' +
        '(₹25,000, target ROAS 600%) and house-party (₹20,000, target CPA ₹280) search, where intent is ' +
        'explicit. Catering is the only stream where one booking at the ₹45,000 modelled AOV repays a ' +
        'full month of clicks.',
      phase: 'p6' },

    { title: 'The 100% repeat hooks rest on four to six first orders each',
      detail: 'Eight dishes — Doodh Katla, Postor Dum, Chilli Chicken Dry, Shorshe Chicken, Posto Chicken, ' +
        'Phulkopir Roast, Egg Fried Rice and Chhanar Kofta Pulao — converted every first order into a ' +
        'repeat, but on samples of 4 to 6 orders. Chicken Croquette (83.3% of 6) and Mutton Kosha ' +
        '(80.0% of 5) form the next tier.',
      implication: 'They are creative hypotheses, not proven winners. Phase 3 features them in the ASMR ' +
        'sizzle series and the 30-dish photography bank at zero incremental cost, while Phase 9 re-measures ' +
        'repeat conversion at n ≥ 30 before any of them is written into a permanent menu or budget line.',
      phase: 'p3' },

    { title: '₹1,31,000 of sales cannot be attributed to a delivery cluster',
      detail: '5.3% of audited revenue carries no recorded address or postal code — a larger figure than ' +
        'any cluster except Emerald Isle, and bigger than Kanjurmarg East (₹74,441) and Godrej Platinum ' +
        '(₹67,825), the two designated expansion corridors, put together.',
      implication: 'Geo-level spend allocation cannot be defended until this closes, and the Month 12 ' +
        'run-rate model — 250 tiffin subscribers at ₹4,500, 1,250 direct orders at ₹650 and 25 events at ' +
        '₹45,000 — depends on clean cluster attribution. Phase 9 mandates address and postal-code capture ' +
        'at website checkout and in the WhatsApp CRM as a reporting precondition.',
      phase: 'p9' }
  ]

});
