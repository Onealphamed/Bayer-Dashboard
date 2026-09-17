/* Phase 7 — Link Building  |  source sheet: "Phase 9 - Link Building & PR" */
PMO.registerPhase({
  id: 'p7',
  number: 7,
  name: 'Link Building',
  subtitle: 'Four-tier authority programme: 108 links and citations across DR 25–85 outlets',
  sourceSheet: 'Phase 9 - Link Building & PR',
  objective: 'Build the off-site authority Howrah Bridge needs to outrank Bhojohori Manna (DR 42+) and the programmatic footprint of Box8/Rebel Foods on Mumbai catering and tiffin terms. The workbook funds four acquisition tiers against a 108-link annual target: 12 high-authority food and lifestyle press features (DR 55–85), 16 wedding and event portal links (DR 45–70), 20 corporate HR and workplace thought-leadership placements (DR 30–50) and 60 NAP-consistent hyper-local citations (DR 25–45). Each tier maps to a commercial engine already carrying revenue — catering at 19% of audited sales, corporate daily meals, and the Powai local pack.',
  expectedOutcome: 'A referring-domain profile strong enough to hold 110+ top-3 keyword rankings and 35,000+ monthly GBP impressions by Month 12, delivered as 48 editorial and vendor links plus 60 clean citations at 100% NAP consistency across the 10 funded postal clusters.',
  riskLevel: 'High',
  health: 'amber',
  extraColumns: [
    { key: 'links', label: 'Links Acquired' },
    { key: 'dr', label: 'Target DR' },
    { key: 'authority', label: 'Authority Impact' }
  ],
  modules: [
    {
      id: 'p7-m1',
      name: 'Guest Posts',
      summary: 'Tier 3 of the Phase 9 plan: 20 annual B2B contextual links at 5 per quarter from People Matters, HR Katha, Mumbai Corporate Lifestyle and Workplaces India (DR 30–50), carried by the thought-leadership angle "Upgrading Workplace Productivity Through Wholesome Home-Style Meal Subscriptions". Placements point at /catering/corporate-mumbai/ and the tiffin subscription funnel.',
      owners: ['Priya N.', 'Nikhil C.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-12-15',
      end: '2026-09-30',
      expectedOutcome: '20 contextual DR 30–50 links feeding the corporate catering silo, supporting the 65+ monthly qualified B2B leads the Month 12 model depends on.',
      dependencies: ['p5-m1'],
      metrics: {
        links: '13 / 20',
        dr: 'DR 30 – 50',
        authority: 'B2B topical relevance'
      },
      tasks: [
        { id: 'p7-m1-t1', name: 'Build the Tier 3 editor list across People Matters, HR Katha and Workplaces India', status: 'completed', due: '2026-01-09', owner: 'Nikhil C.' },
        { id: 'p7-m1-t2', name: 'Draft the anchor piece on workplace productivity and home-style meal subscriptions', status: 'completed', due: '2026-02-06', owner: 'Priya N.' },
        { id: 'p7-m1-t3', name: 'Place the Q1 quota of 5 B2B contextual links on People Matters and HR Katha', status: 'completed', due: '2026-03-27', owner: 'Nikhil C.' },
        { id: 'p7-m1-t4', name: 'Land the Q2 quota of 5 links using BKC corporate subscription case data', status: 'completed', due: '2026-06-26', owner: 'Priya N.' },
        { id: 'p7-m1-t5', name: 'Ghostwrite the HR Katha piece on office tiffin hygiene and FSSAI compliance', status: 'completed', due: '2026-07-31', owner: 'Priya N.' },
        { id: 'p7-m1-t6', name: 'Pitch Workplaces India on the Andheri MIDC and SEEPZ desk-lunch subscription study', status: 'in-progress', due: '2026-09-25', owner: 'Nikhil C.' },
        { id: 'p7-m1-t7', name: 'Secure the final 5 Q4 placements to close the 20-link Tier 3 annual target', status: 'in-progress', due: '2026-09-30', owner: 'Nikhil C.' },
        { id: 'p7-m1-t8', name: 'Audit anchor-text spread across placed Tier 3 links for over-optimisation', status: 'not-started', due: '2026-09-28', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Tier 3 corporate blog target list and editor contact map', status: 'Delivered', due: '2026-01-09', owner: 'Nikhil C.', dependency: '—', priority: 'High' },
        { name: 'Workplace meal-subscription thought-leadership asset library (4 pieces)', status: 'Delivered', due: '2026-07-31', owner: 'Priya N.', dependency: 'Corporate client testimonials (Howrah Ops)', priority: 'High' },
        { name: 'Q4 placement schedule closing the 20-link Tier 3 target', status: 'In Progress', due: '2026-09-30', owner: 'Nikhil C.', dependency: 'Editorial slots at People Matters and Workplaces India', priority: 'High' },
        { name: 'Anchor-text and link-profile audit for the Tier 3 set', status: 'Pending', due: '2026-09-28', owner: 'Sohini B.', dependency: 'Ahrefs referring-domain export', priority: 'Medium' }
      ]
    },
    {
      id: 'p7-m2',
      name: 'PR Outreach',
      summary: 'Tier 1 of the Phase 9 plan: 12 annual high-authority editorial features at 3 per quarter across LBB Mumbai, Curly Tales, Mid-Day Food, Mumbai Live and Times Food (DR 55–85), pitched on "How This Powai Cloud Kitchen is Keeping Kolkata\'s Heritage Alive in Mumbai". Blocked: the Mid-Day Food heritage feature is written and shot but is held awaiting the publication\'s editorial slot.',
      owners: ['Nikhil C.', 'Arjun M.'],
      priority: 'Critical',
      status: 'blocked',
      start: '2026-01-05',
      end: '2026-09-30',
      expectedOutcome: '12 DR 55–85 editorial features establishing Howrah Bridge as the authentic Bengali heritage kitchen in Mumbai, ahead of Bhojohori Manna on brand and discovery search.',
      dependencies: ['p5-m1'],
      metrics: {
        links: '7 / 12',
        dr: 'DR 55 – 85',
        authority: 'Citywide brand authority'
      },
      tasks: [
        { id: 'p7-m2-t1', name: 'Build the Tier 1 media list across LBB Mumbai, Curly Tales and Mumbai Live', status: 'completed', due: '2026-01-30', owner: 'Nikhil C.' },
        { id: 'p7-m2-t2', name: 'Write the heritage press kit on Kosha Mangsho, Shukto and Doodh Katla provenance', status: 'completed', due: '2026-02-13', owner: 'Priya N.' },
        { id: 'p7-m2-t3', name: 'Land the LBB Mumbai feature on the Powai heritage cloud kitchen story', status: 'completed', due: '2026-02-27', owner: 'Nikhil C.' },
        { id: 'p7-m2-t4', name: 'Secure the Curly Tales Kolkata-in-Mumbai food trail placement', status: 'completed', due: '2026-03-20', owner: 'Nikhil C.' },
        { id: 'p7-m2-t5', name: 'Place the Mumbai Live Poila Baisakh grand-feast feature before the April climax', status: 'completed', due: '2026-04-10', owner: 'Nikhil C.' },
        { id: 'p7-m2-t6', name: 'Confirm the Mid-Day Food editorial slot for the heritage kitchen feature', status: 'blocked', due: '2026-08-28', owner: 'Nikhil C.' },
        { id: 'p7-m2-t7', name: 'Supply Mid-Day Food the shoot-ready kitchen and Bhetki Fish Fry image set', status: 'blocked', due: '2026-09-04', owner: 'Riya S.' },
        { id: 'p7-m2-t8', name: 'Pitch Times Food on the Month 12 spring menu and annual milestone story', status: 'in-progress', due: '2026-09-26', owner: 'Nikhil C.' }
      ],
      deliverables: [
        { name: 'Heritage press kit and founder story pack for Tier 1 outlets', status: 'Delivered', due: '2026-02-13', owner: 'Priya N.', dependency: 'Kitchen shoot access (Howrah Ops)', priority: 'Critical' },
        { name: 'LBB Mumbai, Curly Tales and Mumbai Live editorial features (7 placed)', status: 'Delivered', due: '2026-04-10', owner: 'Nikhil C.', dependency: '—', priority: 'Critical' },
        { name: 'Mid-Day Food heritage kitchen feature', status: 'Blocked', due: '2026-08-28', owner: 'Nikhil C.', dependency: 'Mid-Day Food editorial calendar slot', priority: 'Critical' },
        { name: 'Times Food Month 12 milestone pitch and spring menu assets', status: 'In Progress', due: '2026-09-26', owner: 'Nikhil C.', dependency: 'Spring menu sign-off (Howrah Ops)', priority: 'High' }
      ]
    },
    {
      id: 'p7-m3',
      name: 'Influencer Outreach',
      summary: 'The 5 Mumbai Bengali food and lifestyle micro-influencers onboarded in Month 3 (Dec 2025) per the Phase 10 roadmap, used for creator-credited links, profile citations and ASMR collaboration reels around the Bhetki Fish Fry and the Basanti Pulao plus Kosha Mangsho flagship pairing. Sits outside the 108-link tier plan and is measured on creator-attributed links and orders.',
      owners: ['Nikhil C.', 'Devika V.'],
      priority: 'Medium',
      status: 'in-progress',
      start: '2025-12-01',
      end: '2026-09-30',
      expectedOutcome: 'A standing 5-creator roster producing credited links and social proof that feeds the Meta ASMR and community campaigns without paid amplification.',
      dependencies: ['p5-m2'],
      metrics: {
        links: '6 / 10',
        dr: 'DR 20 – 40',
        authority: 'Social proof & discovery'
      },
      tasks: [
        { id: 'p7-m3-t1', name: 'Shortlist 12 Mumbai Bengali micro-influencers by Powai and Andheri audience share', status: 'completed', due: '2025-12-12', owner: 'Nikhil C.' },
        { id: 'p7-m3-t2', name: 'Onboard the first 5 micro-influencers on barter-plus-fee kitchen visit contracts', status: 'completed', due: '2025-12-26', owner: 'Nikhil C.' },
        { id: 'p7-m3-t3', name: 'Run the ASMR Bhetki Fish Fry collaboration reels with all 5 creators', status: 'completed', due: '2026-02-20', owner: 'Devika V.' },
        { id: 'p7-m3-t4', name: 'Secure creator blog and profile credits linking to /catering/wedding-mumbai/', status: 'completed', due: '2026-05-15', owner: 'Nikhil C.' },
        { id: 'p7-m3-t5', name: 'Brief creators on the monsoon Khichuri and Ilish menu drop', status: 'in-progress', due: '2026-09-18', owner: 'Devika V.' },
        { id: 'p7-m3-t6', name: 'Negotiate a second 5-creator cohort covering Vikhroli and Kanjurmarg', status: 'in-progress', due: '2026-09-25', owner: 'Nikhil C.' },
        { id: 'p7-m3-t7', name: 'Reconcile creator-attributed orders against the UTM and BRIDGE20 code set', status: 'in-progress', due: '2026-09-22', owner: 'Aditya T.' },
        { id: 'p7-m3-t8', name: 'Publish the creator performance scorecard for the Month 12 handover pack', status: 'not-started', due: '2026-09-30', owner: 'Nikhil C.' }
      ],
      deliverables: [
        { name: 'Five-creator roster with barter-plus-fee contracts and usage rights', status: 'Delivered', due: '2025-12-26', owner: 'Nikhil C.', dependency: 'Kitchen visit scheduling (Howrah Ops)', priority: 'Medium' },
        { name: 'ASMR collaboration reel set and creator-credited link log', status: 'Delivered', due: '2026-05-15', owner: 'Devika V.', dependency: '—', priority: 'Medium' },
        { name: 'Second-cohort creator brief for the Vikhroli–Kanjurmarg corridor', status: 'In Review', due: '2026-09-25', owner: 'Nikhil C.', dependency: 'Delivery radius confirmation', priority: 'Low' },
        { name: 'Creator performance and attribution scorecard', status: 'Pending', due: '2026-09-30', owner: 'Aditya T.', dependency: 'GA4 UTM reconciliation', priority: 'Medium' }
      ]
    },
    {
      id: 'p7-m4',
      name: 'Business Directories',
      summary: 'The business and trade half of the Phase 9 Tier 4 programme: 24 of the 60 annual citations placed on Justdial Mumbai, Sulekha, IndiaMART, TradeIndia and the Bombay Chamber of Commerce (DR 25–45), all carrying the canonical NAP "Howrah Bridge - Bengali Cloud Kitchen & Catering Services, Powai Hub, Off Saki Vihar Road, Mumbai 400072" with full catering service category tagging.',
      owners: ['Meera S.', 'Sohini B.'],
      priority: 'High',
      status: 'completed',
      start: '2025-12-01',
      end: '2026-06-30',
      expectedOutcome: '24 verified B2B and trade citations at 100% NAP consistency, opening the corporate and bulk-catering enquiry channel that IndiaMART and the Bombay Chamber carry.',
      dependencies: ['p4-m1'],
      metrics: {
        links: '24 / 24',
        dr: 'DR 25 – 45',
        authority: 'B2B trade discoverability'
      },
      tasks: [
        { id: 'p7-m4-t1', name: 'Lock the canonical NAP string used across every Tier 4 directory submission', status: 'completed', due: '2025-12-19', owner: 'Meera S.' },
        { id: 'p7-m4-t2', name: 'Claim and verify the Justdial Mumbai and Sulekha caterer listings', status: 'completed', due: '2026-01-16', owner: 'Meera S.' },
        { id: 'p7-m4-t3', name: 'Publish IndiaMART and TradeIndia catering catalogues with per-plate price bands', status: 'completed', due: '2026-02-27', owner: 'Meera S.' },
        { id: 'p7-m4-t4', name: 'Register the Bombay Chamber of Commerce member profile and trade listing', status: 'completed', due: '2026-04-17', owner: 'Arjun M.' },
        { id: 'p7-m4-t5', name: 'Tag every listing with the catering category and the 10 funded postal clusters', status: 'completed', due: '2026-05-22', owner: 'Meera S.' },
        { id: 'p7-m4-t6', name: 'Run the NAP consistency sweep across all 24 business directory citations', status: 'completed', due: '2026-06-30', owner: 'Sohini B.' }
      ],
      deliverables: [
        { name: 'Canonical NAP standard and directory submission playbook', status: 'Delivered', due: '2025-12-19', owner: 'Meera S.', dependency: 'GBP entity name from Phase 4', priority: 'High' },
        { name: 'Verified Justdial, Sulekha, IndiaMART and TradeIndia listings', status: 'Delivered', due: '2026-02-27', owner: 'Meera S.', dependency: 'FSSAI and GST documents (Howrah Ops)', priority: 'High' },
        { name: 'Bombay Chamber of Commerce membership and trade profile', status: 'Delivered', due: '2026-04-17', owner: 'Arjun M.', dependency: 'Membership fee approval', priority: 'Medium' },
        { name: 'Tier 4 business citation register with NAP audit results', status: 'Delivered', due: '2026-06-30', owner: 'Sohini B.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p7-m5',
      name: 'Food Directories',
      summary: 'Tier 2 of the Phase 9 plan plus the food verticals: 16 annual verified event links at 4 per quarter from WedMeGood, WeddingWire India, ShaadiSaga, Eventila and WeddingBazaar (DR 45–70), alongside the Magicpin Powai food listing. Assets are vendor profile listings and featured articles on traditional Bengali wedding menus and per-plate pricing.',
      owners: ['Meera S.', 'Nikhil C.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2026-01-05',
      end: '2026-09-30',
      expectedOutcome: '16 verified wedding and event portal links driving inbound bridal RFPs into the ₹45,000-per-event catering stream that carries 19% of audited sales.',
      dependencies: ['p7-m4'],
      metrics: {
        links: '9 / 16',
        dr: 'DR 45 – 70',
        authority: 'Wedding & event vertical'
      },
      tasks: [
        { id: 'p7-m5-t1', name: 'Build verified WedMeGood and WeddingWire India vendor profiles with pricing', status: 'completed', due: '2026-01-30', owner: 'Meera S.' },
        { id: 'p7-m5-t2', name: 'Publish the ShaadiSaga vendor listing with the Bengali wedding menu gallery', status: 'completed', due: '2026-03-13', owner: 'Meera S.' },
        { id: 'p7-m5-t3', name: 'Place the featured article on traditional Bengali wedding menus and pricing', status: 'completed', due: '2026-04-24', owner: 'Priya N.' },
        { id: 'p7-m5-t4', name: 'Claim and optimise the Magicpin Powai food listing with the signature menu', status: 'completed', due: '2026-06-12', owner: 'Meera S.' },
        { id: 'p7-m5-t5', name: 'Complete the Eventila and WeddingBazaar vendor verification and portfolio uploads', status: 'in-progress', due: '2026-09-04', owner: 'Meera S.' },
        { id: 'p7-m5-t6', name: 'Secure the Q3 quota of 4 verified event links from the monsoon wedding showcase', status: 'in-progress', due: '2026-09-19', owner: 'Nikhil C.' },
        { id: 'p7-m5-t7', name: 'Sync 2026 per-plate pricing bands across all five wedding portal profiles', status: 'in-progress', due: '2026-09-24', owner: 'Meera S.' },
        { id: 'p7-m5-t8', name: 'Close the remaining Tier 2 placements to reach the 16-link annual target', status: 'not-started', due: '2026-09-30', owner: 'Nikhil C.' }
      ],
      deliverables: [
        { name: 'Verified vendor profiles on WedMeGood, WeddingWire India and ShaadiSaga', status: 'Delivered', due: '2026-03-13', owner: 'Meera S.', dependency: 'Wedding portfolio photography', priority: 'Critical' },
        { name: 'Bengali wedding menu and per-plate pricing featured article', status: 'Delivered', due: '2026-04-24', owner: 'Priya N.', dependency: 'Per-plate pricing sheets (Howrah Ops)', priority: 'High' },
        { name: 'Eventila and WeddingBazaar verified vendor listings', status: 'In Progress', due: '2026-09-04', owner: 'Meera S.', dependency: 'Portal verification review queue', priority: 'High' },
        { name: 'Tier 2 link register against the 16-link annual target', status: 'In Progress', due: '2026-09-30', owner: 'Nikhil C.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p7-m6',
      name: 'Local Citations',
      summary: 'The hyper-local half of the Phase 9 Tier 4 programme: 36 of the 60 annual citations placed on neighbourhood directories, society portals and Bengali cultural association listings across the 10 funded postal clusters from Powai 400076 to Kanjurmarg 400078, all at 100% NAP consistency to reinforce the local pack around the Emerald Isle home turf.',
      owners: ['Meera S.', 'Sohini B.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-12-08',
      end: '2026-09-30',
      expectedOutcome: '36 clean hyper-local citations underwriting top-3 local pack rankings and the 35,000+ monthly GBP impression target for Month 12.',
      dependencies: ['p4-m1', 'p7-m4'],
      metrics: {
        links: '19 / 36',
        dr: 'DR 25 – 45',
        authority: 'Local pack & NAP trust'
      },
      tasks: [
        { id: 'p7-m6-t1', name: 'Map the 10 postal clusters from Powai 400076 to Kanjurmarg 400078 for citations', status: 'completed', due: '2026-01-23', owner: 'Meera S.' },
        { id: 'p7-m6-t2', name: 'Submit the first 15 hyper-local citations across Powai, Andheri East and Sakinaka', status: 'completed', due: '2026-03-31', owner: 'Meera S.' },
        { id: 'p7-m6-t3', name: 'Build society citations for Emerald Isle, Lake Homes and Godrej Platinum', status: 'completed', due: '2026-06-26', owner: 'Meera S.' },
        { id: 'p7-m6-t4', name: 'Extend citation coverage to the Goregaon and Malad western delivery radius', status: 'in-progress', due: '2026-08-21', owner: 'Meera S.' },
        { id: 'p7-m6-t5', name: 'Clean duplicate and legacy pins carrying the pre-2025 kitchen address', status: 'in-progress', due: '2026-09-19', owner: 'Sohini B.' },
        { id: 'p7-m6-t6', name: 'Add the remaining 17 citations needed to hit the 36-citation Tier 4 split', status: 'in-progress', due: '2026-09-30', owner: 'Meera S.' },
        { id: 'p7-m6-t7', name: 'Re-run the quarterly NAP audit across all live hyper-local citations', status: 'not-started', due: '2026-09-26', owner: 'Sohini B.' },
        { id: 'p7-m6-t8', name: 'Hand the citation register and listing login vault to Howrah Ops', status: 'not-started', due: '2026-09-30', owner: 'Arjun M.' }
      ],
      deliverables: [
        { name: 'Postal cluster citation map for the 10 funded delivery zones', status: 'Delivered', due: '2026-01-23', owner: 'Meera S.', dependency: 'GBP service area polygons from Phase 4', priority: 'High' },
        { name: 'Society and cultural association citation set (Powai and Vikhroli)', status: 'Delivered', due: '2026-06-26', owner: 'Meera S.', dependency: 'Committee introductions (Howrah Ops)', priority: 'Medium' },
        { name: 'Duplicate and legacy-address pin remediation report', status: 'In Progress', due: '2026-09-19', owner: 'Sohini B.', dependency: 'Google Maps suggest-an-edit review', priority: 'High' },
        { name: 'Citation register and listing login vault handover', status: 'Pending', due: '2026-09-30', owner: 'Arjun M.', dependency: 'Client credential policy sign-off', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R7.1',
      risk: 'The Mid-Day Food heritage kitchen feature is written, shot and approved by the desk but is held awaiting an editorial slot, stalling 2 of the 3 remaining Tier 1 features and the 12-link annual target.',
      impact: 'High', probability: 'High', owner: 'Nikhil C.',
      mitigation: 'Feature re-angled to the Poila Baisakh seasonal hook so it carries a news peg the desk can schedule against, with Times Food and Mumbai Live pitched in parallel as substitutable Tier 1 placements rather than additive ones.',
      status: 'Mitigating' },
    { id: 'R7.2',
      risk: 'Duplicate and legacy Google Maps pins carrying the pre-2025 kitchen address contradict the canonical Powai Hub NAP, diluting the citation signal the local pack ranking depends on.',
      impact: 'High', probability: 'Medium', owner: 'Meera S.',
      mitigation: 'Suggest-an-edit and removal requests filed on every duplicate pin, a single canonical NAP string enforced across all 60 Tier 4 submissions, and a quarterly audit run against the register before any new citation is placed.',
      status: 'Mitigating' },
    { id: 'R7.3',
      risk: 'WedMeGood, WeddingWire India and ShaadiSaga gate premium vendor placement behind paid listings and mark outbound vendor links nofollow, so Tier 2 delivers referral traffic without the DR 45–70 equity the plan assumes.',
      impact: 'Medium', probability: 'High', owner: 'Nikhil C.',
      mitigation: 'Tier 2 value reframed on bridal RFP volume into the ₹45,000-per-event stream, with editorial featured articles on Bengali wedding menus prioritised over profile listings because those carry followed contextual links.',
      status: 'Monitoring' },
    { id: 'R7.4',
      risk: 'People Matters and HR Katha increasingly route guest contributions through sponsored-content desks, putting the final 7 Tier 3 placements outside the outreach budget agreed for the phase.',
      impact: 'Medium', probability: 'Medium', owner: 'Priya N.',
      mitigation: 'Original BKC corporate subscription case data offered as the exchange of value in place of fees, and Mumbai Corporate Lifestyle and Workplaces India weighted higher in the Q4 mix where editorial contribution remains free.',
      status: 'Open' },
    { id: 'R7.5',
      risk: 'Creator-credited placements from the 5 micro-influencers are profile and bio links rather than editorial, so they pass little authority and cannot be counted toward the 108-link programme target.',
      impact: 'Low', probability: 'Medium', owner: 'Nikhil C.',
      mitigation: 'Influencer links tracked as a separate 10-link creator target outside the four tiers, measured on attributed orders through the UTM and BRIDGE20 code set rather than on referring-domain contribution.',
      status: 'Monitoring' },
    { id: 'R7.6',
      risk: 'Acquisition is running at 72 of 108 links with one month left, concentrating the shortfall into Month 12 and risking an unnatural velocity spike that devalues the whole profile.',
      impact: 'High', probability: 'Medium', owner: 'Sohini B.',
      mitigation: 'Remaining placements sequenced across the final four weeks at no more than 9 links a week, weighted toward Tier 4 citations where volume is expected, with Tier 1 and Tier 2 shortfalls rolled into the Year 2 scope rather than forced.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Total links & citations acquired', baseline: '0', target: '108', current: '72', unit: '', direction: 'up' },
    { label: 'Tier 1 high-DA editorial features', baseline: '0', target: '12', current: '7', unit: '', direction: 'up' },
    { label: 'Tier 2 verified event links', baseline: '0', target: '16', current: '9', unit: '', direction: 'up' },
    { label: 'Tier 3 B2B contextual links', baseline: '0', target: '20', current: '13', unit: '', direction: 'up' },
    { label: 'Tier 4 clean local citations', baseline: '0', target: '60', current: '43', unit: '', direction: 'up' },
    { label: 'Quarterly link run-rate', baseline: '0', target: '27', current: '19', unit: '/ qtr', direction: 'up' }
  ],
  notes: 'Tier definitions, target outlets, DR bands, editorial pitch angles, annual link targets and quarterly milestones are taken verbatim from the Phase 9 sheet; the 60 Tier 4 citations are split 24 to business and trade directories and 36 to hyper-local listings for PMO tracking only. Outreach sequencing follows the Phase 10 roadmap (directory submissions from Month 3, wedding vendor platforms and local PR from Month 4, first LBB and Curly Tales mentions in Month 5, corporate HR outreach from Month 8, wedding backlinks from Month 9). Link counts were reconciled against Ahrefs referring domains on 15 Sep 2026.'
});
