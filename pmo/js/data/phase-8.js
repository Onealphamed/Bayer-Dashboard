/* Phase 8 — Conversion Optimization  |  source sheet: "Phase 8 - CRO & Funnels" */
PMO.registerPhase({
  id: 'p8',
  number: 8,
  name: 'Conversion Optimization',
  subtitle: 'Four funnel fixes carrying +28% to +85% projected uplift on the direct order path',
  sourceSheet: 'Phase 8 - CRO & Funnels',
  objective: 'Convert the traffic the SEO, content and paid phases now deliver into direct orders and catering leads, by rebuilding the four friction points the CRO audit identified: a generic six-field Contact Us form abandoned by 82% of catering enquirers, a hamburger menu that hides the ordering actions on mobile, testimonials with no verifiable proof, and a static dish catalogue with no immediate checkout. Each fix is engineered against a named technical component and a projected uplift, so the phase is measured on conversion rate rather than on pages shipped. The phase carries the direct-revenue half of the Month 12 run-rate model: 1,250 direct orders and 25 booked events a month.',
  expectedOutcome: 'A direct ordering path that lifts catering form completion by 65%, mobile interaction by 42% and direct order rate by 85%, moving the site from a static brochure to the owned checkout channel that avoids 22-28% aggregator commission.',
  riskLevel: 'High',
  health: 'amber',
  extraColumns: [
    { key: 'uplift', label: 'Projected Uplift' },
    { key: 'impact', label: 'Impact Score' },
    { key: 'component', label: 'Technical Component' }
  ],
  modules: [
    {
      id: 'p8-m1',
      name: 'Landing Pages',
      summary: 'The dedicated conversion pages the Month 2 and Month 4 roadmap steps call for — /catering/corporate-catering-mumbai/, /daily-meals/tiffin-service-mumbai/ and the Powai, Andheri East and BKC hub pages — rebuilt around a single conversion block. The CRO sheet’s Social Proof and Trust Signals fix lands here: live Google Review badges carrying the 4.7-star average and a corporate client logo strip from BKC and Powai accounts, replacing unverifiable testimonials.',
      owners: ['Riya S.', 'Vikram D.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-11-10',
      end: '2026-09-15',
      expectedOutcome: '+28% booking confidence on catering pages, lifting the quote-to-booking rate from 9% toward 11.5% on the same lead volume.',
      dependencies: ['p1-m1', 'p4-m5'],
      metrics: {
        uplift: '+28% Booking Confidence',
        impact: '6 / 10',
        component: 'Google Reviews API Integration'
      },
      tasks: [
        { id: 'p8-m1-t1', name: 'Launch /catering/corporate-catering-mumbai/ against office lunch catering bkc (880/mo, KD 18%)', status: 'completed', due: '2025-11-28', owner: 'Vikram D.' },
        { id: 'p8-m1-t2', name: 'Launch /daily-meals/tiffin-service-mumbai/ for tiffin service mumbai (4,500/mo, KD 38%)', status: 'completed', due: '2025-12-12', owner: 'Vikram D.' },
        { id: 'p8-m1-t3', name: 'Publish the /locations/powai/, /locations/andheri-east/ and /locations/bkc/ hub pages', status: 'completed', due: '2026-01-30', owner: 'Sohini B.' },
        { id: 'p8-m1-t4', name: 'Embed the live Google Review badge carrying the 4.7-star average above the fold', status: 'completed', due: '2026-03-06', owner: 'Rahul K.' },
        { id: 'p8-m1-t5', name: 'Add the BKC and Powai corporate client logo strip to both catering landing pages', status: 'completed', due: '2026-04-17', owner: 'Riya S.' },
        { id: 'p8-m1-t6', name: 'Rebuild the wedding catering hero around per-plate pricing from ₹700 to ₹1,000', status: 'in-progress', due: '2026-09-18', owner: 'Riya S.' },
        { id: 'p8-m1-t7', name: 'Ship the Poila Baisakh pre-booking landing page for the Month 12 seasonal assets', status: 'in-progress', due: '2026-09-29', owner: 'Priya N.' }
      ],
      deliverables: [
        { name: 'Corporate and tiffin landing page templates with unified conversion block', status: 'Delivered', due: '2025-12-12', owner: 'Vikram D.', dependency: 'Client staging access (Howrah Ops)', priority: 'Critical' },
        { name: 'Hyper-local hub page set for Powai, Andheri East and BKC', status: 'Delivered', due: '2026-01-30', owner: 'Sohini B.', dependency: 'Phase 3 keyword architecture', priority: 'High' },
        { name: 'Google Reviews API badge component with 4.7-star live feed', status: 'Delivered', due: '2026-03-06', owner: 'Rahul K.', dependency: 'Google Reviews API quota approval', priority: 'High' },
        { name: 'Poila Baisakh seasonal landing page and pre-booking block', status: 'In Progress', due: '2026-09-29', owner: 'Priya N.', dependency: 'Spring menu pricing sign-off', priority: 'Medium' }
      ]
    },
    {
      id: 'p8-m2',
      name: 'CTA Optimization',
      summary: 'The Mobile Navigation and Viewport fix from the CRO sheet: the standard hamburger menu hid the core ordering actions, so a persistent sticky bottom bar carrying [Call Kitchen] and [Order on WhatsApp] now sits on every mobile template. Built as a CSS sticky viewport footer with the 48px minimum touch targets the Phase 1 audit demanded, against the audited sub-32px padding that was driving mobile bounce.',
      owners: ['Riya S.', 'Vikram D.'],
      priority: 'Critical',
      status: 'completed',
      start: '2025-11-17',
      end: '2026-04-24',
      expectedOutcome: '+42% mobile interaction rate, exposing the call and WhatsApp ordering paths on every mobile session instead of burying them one tap deep.',
      dependencies: ['p1-m4'],
      metrics: {
        uplift: '+42% Mobile Interaction Rate',
        impact: '7 / 10',
        component: 'CSS Sticky Viewport Footer'
      },
      tasks: [
        { id: 'p8-m2-t1', name: 'Ship the persistent sticky bottom bar with [Call Kitchen] and [Order on WhatsApp]', status: 'completed', due: '2025-12-19', owner: 'Vikram D.' },
        { id: 'p8-m2-t2', name: 'Raise bar tap targets to a 48px minimum from the audited sub-32px padding', status: 'completed', due: '2026-01-09', owner: 'Riya S.' },
        { id: 'p8-m2-t3', name: 'Remove the duplicate ordering links now hidden inside the hamburger menu', status: 'completed', due: '2026-01-30', owner: 'Vikram D.' },
        { id: 'p8-m2-t4', name: 'A/B test [Order on WhatsApp] against [Order Now] over three weeks of mobile sessions', status: 'completed', due: '2026-02-27', owner: 'Aditya T.' },
        { id: 'p8-m2-t5', name: 'Extend the sticky bar to blog, menu and festival page templates', status: 'completed', due: '2026-03-27', owner: 'Vikram D.' },
        { id: 'p8-m2-t6', name: 'Verify the bar clears the iOS Safari dynamic viewport inset on six test devices', status: 'completed', due: '2026-04-24', owner: 'Rahul K.' }
      ],
      deliverables: [
        { name: 'Sticky mobile conversion bar component (48px touch targets)', status: 'Delivered', due: '2025-12-19', owner: 'Vikram D.', dependency: 'Mobile UX findings from Phase 1 audit', priority: 'Critical' },
        { name: 'Mobile CTA copy test readout ([Order on WhatsApp] vs [Order Now])', status: 'Delivered', due: '2026-02-27', owner: 'Aditya T.', dependency: 'GA4 event layer', priority: 'High' },
        { name: 'Cross-template rollout and cross-device viewport QA log', status: 'Delivered', due: '2026-04-24', owner: 'Rahul K.', dependency: '—', priority: 'Medium' }
      ]
    },
    {
      id: 'p8-m3',
      name: 'WhatsApp Optimization',
      summary: 'The WhatsApp API deep-link generator and the Business API layer behind it: pre-filled order threads, a scripted catering intake and quote flow for the kitchen desk, and attribution across the 1,250 monthly direct chats Meta Campaign 6 is funded to produce. BLOCKED: the message template approval and the commerce catalogue review are still pending with Meta, which gates the 1-click checkout rollout in Checkout Funnel.',
      owners: ['Rahul K.', 'Howrah Ops'],
      priority: 'Critical',
      status: 'blocked',
      start: '2026-01-12',
      end: '2026-09-15',
      expectedOutcome: 'A compliant WhatsApp ordering channel that carries the +85% direct order rate uplift from ad click and menu page through to a confirmed kitchen order.',
      dependencies: ['p5-m6', 'p8-m2'],
      metrics: {
        uplift: '+85% Direct Order Rate (API enabler)',
        impact: '9 / 10',
        component: 'WhatsApp Business API & Commerce Catalogue'
      },
      tasks: [
        { id: 'p8-m3-t1', name: 'Build the WhatsApp deep-link generator pre-filling dish name and delivery pin code', status: 'completed', due: '2026-02-20', owner: 'Rahul K.' },
        { id: 'p8-m3-t2', name: 'Route Click-to-WhatsApp ad traffic into the same pre-filled order thread', status: 'completed', due: '2026-03-20', owner: 'Devika V.' },
        { id: 'p8-m3-t3', name: 'Script the catering intake and quote flow for the kitchen WhatsApp desk', status: 'completed', due: '2026-05-08', owner: 'Howrah Ops' },
        { id: 'p8-m3-t4', name: 'Submit the six order-confirmation and quote message templates for Meta approval', status: 'blocked', due: '2026-07-24', owner: 'Rahul K.' },
        { id: 'p8-m3-t5', name: 'Clear the Meta commerce catalogue review across the six GBP menu categories', status: 'blocked', due: '2026-08-14', owner: 'Rahul K.' },
        { id: 'p8-m3-t6', name: 'Hold WhatsApp desk first response under the 12-hour standard through Month 12', status: 'in-progress', due: '2026-09-22', owner: 'Howrah Ops' },
        { id: 'p8-m3-t7', name: 'Attribute orders against the 1,250 monthly direct chats from Meta Campaign 6', status: 'in-progress', due: '2026-09-26', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'WhatsApp API deep-link URL generator (dish, portion, pin code)', status: 'Delivered', due: '2026-02-20', owner: 'Rahul K.', dependency: 'Verified WhatsApp Business number', priority: 'Critical' },
        { name: 'Approved message template set (order confirmation, quote, dispatch)', status: 'Blocked', due: '2026-07-24', owner: 'Rahul K.', dependency: 'Meta template approval queue', priority: 'Critical' },
        { name: 'Commerce catalogue covering the six GBP menu categories', status: 'Blocked', due: '2026-08-14', owner: 'Rahul K.', dependency: 'Meta commerce policy review', priority: 'Critical' },
        { name: 'Kitchen WhatsApp desk intake and quote playbook', status: 'Delivered', due: '2026-05-08', owner: 'Howrah Ops', dependency: '—', priority: 'High' }
      ]
    },
    {
      id: 'p8-m4',
      name: 'Lead Forms',
      summary: 'The Catering Lead Capture fix: the generic Contact Us form with six mandatory fields, abandoned by 82% of enquirers, replaced by a three-step interactive Catering Cost Calculator that returns an instant WhatsApp estimate. Built as a dynamic React calculator widget carrying the mid-market per-plate tiers of ₹700 to ₹1,000 the competitive analysis positions against Oh! Calcutta’s ₹1,800+ pricing.',
      owners: ['Riya S.', 'Vikram D.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2025-12-01',
      end: '2026-09-15',
      expectedOutcome: '+65% catering form completion rate, lifting completion from 18% to roughly 30% and feeding the 160+ qualified catering leads a month Month 12 target.',
      dependencies: ['p1-m4', 'p8-m1'],
      metrics: {
        uplift: '+65% Form Completion Rate',
        impact: '8 / 10',
        component: 'Dynamic React / Vue Calculator Widget'
      },
      tasks: [
        { id: 'p8-m4-t1', name: 'Quantify the 82% abandonment on the six-field form across eight weeks of GA4 sessions', status: 'completed', due: '2025-12-19', owner: 'Aditya T.' },
        { id: 'p8-m4-t2', name: 'Design the three-step calculator flow: guest count, menu tier, event date', status: 'completed', due: '2026-01-23', owner: 'Riya S.' },
        { id: 'p8-m4-t3', name: 'Build the React calculator widget with per-plate tiers from ₹700 to ₹1,000', status: 'completed', due: '2026-03-06', owner: 'Vikram D.' },
        { id: 'p8-m4-t4', name: 'Wire the instant WhatsApp estimate hand-off at step three of the calculator', status: 'completed', due: '2026-04-10', owner: 'Rahul K.' },
        { id: 'p8-m4-t5', name: 'Retire the legacy six-field form from all four catering landing pages', status: 'in-progress', due: '2026-09-18', owner: 'Vikram D.' },
        { id: 'p8-m4-t6', name: 'Sync Meta Campaign 5 instant-form leads into the calculator quote pipeline', status: 'in-progress', due: '2026-09-21', owner: 'Devika V.' },
        { id: 'p8-m4-t7', name: 'Add a wedding per-plate tier for the ₹1.5L+ AOV bridal cohort', status: 'not-started', due: '2026-09-28', owner: 'Aditya T.' }
      ],
      deliverables: [
        { name: 'Three-step Catering Cost Calculator widget (React)', status: 'Delivered', due: '2026-03-06', owner: 'Vikram D.', dependency: 'Per-plate pricing matrix from Howrah Ops', priority: 'Critical' },
        { name: 'Instant WhatsApp estimate hand-off at calculator step three', status: 'Delivered', due: '2026-04-10', owner: 'Rahul K.', dependency: 'Deep-link generator (p8-m3)', priority: 'Critical' },
        { name: 'Legacy contact form retirement and 301 mapping plan', status: 'In Progress', due: '2026-09-18', owner: 'Vikram D.', dependency: 'Client sign-off on form removal', priority: 'High' },
        { name: 'Meta Campaign 5 lead-to-quote sync specification', status: 'In Review', due: '2026-09-21', owner: 'Devika V.', dependency: 'CRM field mapping', priority: 'Medium' }
      ]
    },
    {
      id: 'p8-m5',
      name: 'Checkout Funnel',
      summary: 'The Menu Ordering Checkout Flow fix: dishes were displayed statically with no immediate checkout, so a direct 1-Click WhatsApp Order button now sits beside the signature dishes, pre-filling dish name, portion count and delivery pin code. Rollout across the 12 signature dish pages is held behind the pending Meta template and catalogue approvals in WhatsApp Optimization.',
      owners: ['Vikram D.', 'Aditya T.'],
      priority: 'Critical',
      status: 'in-progress',
      start: '2026-02-02',
      end: '2026-09-15',
      expectedOutcome: '+85% direct order rate on menu pages, protecting the 22-28% aggregator commission the workbook targets on 1,250 direct orders a month.',
      dependencies: ['p8-m3', 'p1-m4'],
      metrics: {
        uplift: '+85% Direct Order Rate',
        impact: '10 / 10',
        component: 'WhatsApp API Deep-link URL Generator'
      },
      tasks: [
        { id: 'p8-m5-t1', name: 'Map static menu drop-off across the 48 fish and 62 chicken dish pages', status: 'completed', due: '2026-03-13', owner: 'Aditya T.' },
        { id: 'p8-m5-t2', name: 'Prototype the 1-Click WhatsApp Order button on Bhetki Fish Fry and Kosha Mangsho', status: 'completed', due: '2026-04-24', owner: 'Vikram D.' },
        { id: 'p8-m5-t3', name: 'Roll the 1-Click WhatsApp Order button across the 12 signature dish pages', status: 'in-progress', due: '2026-08-28', owner: 'Vikram D.' },
        { id: 'p8-m5-t4', name: 'Pre-fill dish name, portion count and delivery pin into the outbound message', status: 'in-progress', due: '2026-09-18', owner: 'Rahul K.' },
        { id: 'p8-m5-t5', name: 'Add the Basanti Pulao + Kosha Mangsho ₹850 Sunday Bhoj bundle as a one-tap upsell', status: 'in-progress', due: '2026-09-22', owner: 'Riya S.' },
        { id: 'p8-m5-t6', name: 'Extend one-tap ordering to the Fish Chop + Vegetable Chop ₹240 tea-time duet', status: 'not-started', due: '2026-09-25', owner: 'Vikram D.' },
        { id: 'p8-m5-t7', name: 'Add a one-tap re-order link to the dispatch confirmation message', status: 'not-started', due: '2026-09-29', owner: 'Howrah Ops' }
      ],
      deliverables: [
        { name: 'Menu page drop-off analysis across 3,525 catalogue line items', status: 'Delivered', due: '2026-03-13', owner: 'Aditya T.', dependency: 'GA4 enhanced measurement', priority: 'High' },
        { name: '1-Click WhatsApp Order button on the 12 signature dish pages', status: 'Blocked', due: '2026-08-28', owner: 'Vikram D.', dependency: 'Meta template approval (p8-m3)', priority: 'Critical' },
        { name: 'Basket bundle upsell configuration (Sunday Bhoj, Street Snack Duet)', status: 'In Progress', due: '2026-09-25', owner: 'Riya S.', dependency: 'Bundle pricing confirmation from Howrah Ops', priority: 'High' }
      ]
    },
    {
      id: 'p8-m6',
      name: 'Conversion Tracking',
      summary: 'The measurement layer that makes the four CRO fixes auditable: a GTM event plan covering calculator steps, sticky bar taps and WhatsApp order intents, deduplicated between the Meta CAPI and the browser pixel, reported as a GA4 funnel exploration. It also closes the audited data gap where 5.3% of sales (₹1,31,000) carry no recorded delivery location.',
      owners: ['Aditya T.', 'Rahul K.'],
      priority: 'High',
      status: 'in-progress',
      start: '2025-11-24',
      end: '2026-09-15',
      expectedOutcome: 'A single reconciled view of landing page view to WhatsApp order, so uplift claims of +28% to +85% are measured rather than asserted at the Month 12 close.',
      dependencies: ['p1-m5', 'p1-m6'],
      metrics: {
        uplift: 'Measurement enabler (no direct uplift)',
        impact: '5 / 10',
        component: 'GTM, GA4 & Meta CAPI Event Layer'
      },
      tasks: [
        { id: 'p8-m6-t1', name: 'Define the nine-event CRO measurement plan in GTM across calculator, bar and WhatsApp', status: 'completed', due: '2026-01-16', owner: 'Aditya T.' },
        { id: 'p8-m6-t2', name: 'Fire calculator step_1, step_2 and quote_sent events from the widget into GA4', status: 'completed', due: '2026-03-27', owner: 'Aditya T.' },
        { id: 'p8-m6-t3', name: 'Close the 5.3% location-not-recorded gap by mandating pin code at checkout', status: 'in-progress', due: '2026-09-19', owner: 'Rahul K.' },
        { id: 'p8-m6-t4', name: 'Deduplicate Meta CAPI and browser pixel events on the WhatsApp order action', status: 'in-progress', due: '2026-09-23', owner: 'Devika V.' },
        { id: 'p8-m6-t5', name: 'Build the GA4 funnel exploration from landing page view to WhatsApp order', status: 'not-started', due: '2026-09-26', owner: 'Aditya T.' },
        { id: 'p8-m6-t6', name: 'Reconcile GA4 direct orders against kitchen dispatch records for the Month 12 close', status: 'not-started', due: '2026-09-29', owner: 'Howrah Ops' }
      ],
      deliverables: [
        { name: 'CRO measurement plan and GTM container specification (9 events)', status: 'Delivered', due: '2026-01-16', owner: 'Aditya T.', dependency: 'GTM and CAPI install from Phase 1', priority: 'High' },
        { name: 'Pin code capture enforcement at checkout and in WhatsApp CRM', status: 'In Progress', due: '2026-09-19', owner: 'Rahul K.', dependency: 'Kitchen CRM field change (Howrah Ops)', priority: 'High' },
        { name: 'GA4 funnel exploration: landing page view to WhatsApp order', status: 'Pending', due: '2026-09-26', owner: 'Aditya T.', dependency: 'CAPI deduplication (p8-m6-t4)', priority: 'Medium' }
      ]
    }
  ],
  risks: [
    { id: 'R8.1',
      risk: 'WhatsApp Business API template approval and the commerce catalogue review remain pending with Meta, blocking the 1-Click WhatsApp Order rollout that carries the phase’s largest projected uplift (+85% direct order rate).',
      impact: 'Critical', probability: 'High', owner: 'Rahul K.',
      mitigation: 'Templates resubmitted with transactional-only wording and the catalogue trimmed to the six GBP menu categories; an interim deep-link path using free-form session messages keeps Bhetki Fish Fry and Kosha Mangsho ordering live while approval clears.',
      status: 'Mitigating' },
    { id: 'R8.2',
      risk: 'The dynamic React calculator widget adds client-side JavaScript to the catering landing pages, risking the INP under 150ms and LCP under 2.1s thresholds set in the Phase 1 technical audit.',
      impact: 'High', probability: 'Medium', owner: 'Vikram D.',
      mitigation: 'Widget code-split and lazy-loaded below the fold, hero imagery served as WebP, and Lighthouse budgets enforced in CI on the four catering templates before each release.',
      status: 'Mitigating' },
    { id: 'R8.3',
      risk: 'The kitchen WhatsApp desk carries both the catering quote flow and 1,250 monthly direct chats from Meta Campaign 6; if first response slips past the 12-hour standard, the conversion gains from the sticky bar and 1-click button reverse into lost orders.',
      impact: 'High', probability: 'Medium', owner: 'Howrah Ops',
      mitigation: 'Scripted intake sheet plus quick replies for the 12 signature dishes, automated acknowledgement inside two minutes, and escalation to the founder line for catering enquiries above 50 guests.',
      status: 'Monitoring' },
    { id: 'R8.4',
      risk: 'Live Google Review badges publish whatever the profile average is; a run of delivery complaints of the kind Bhojohori Manna absorbed would broadcast a falling score directly on the highest-intent catering pages.',
      impact: 'Medium', probability: 'Low', owner: 'Meera S.',
      mitigation: 'Badge renders only while the rolling average holds at or above 4.5, with a static trust block as fallback; review velocity maintained through the packaging QR cards and post-dispatch WhatsApp link.',
      status: 'Monitoring' },
    { id: 'R8.5',
      risk: 'Corporate logo usage consent for the BKC and Powai client strip is informal, exposing the trust block to withdrawal requests and weakening the +28% booking confidence case.',
      impact: 'Medium', probability: 'Medium', owner: 'Nikhil C.',
      mitigation: 'Written consent collected from six corporate accounts with an annual renewal clause; anonymised sector descriptors held ready to replace any logo withdrawn at short notice.',
      status: 'Mitigating' },
    { id: 'R8.6',
      risk: '5.3% of audited sales (₹1,31,000) carry no recorded delivery location, so funnel attribution and delivery-zone optimisation stay unreliable until pin code capture is mandatory at checkout and in the WhatsApp CRM.',
      impact: 'Medium', probability: 'High', owner: 'Aditya T.',
      mitigation: 'Pin code made a required field at checkout and a mandatory first prompt in the WhatsApp intake script, with the GA4 to dispatch reconciliation run weekly through the Month 12 close.',
      status: 'Mitigating' }
  ],
  kpis: [
    { label: 'Catering form completion rate', baseline: '18%', target: '30%', current: '27%', unit: '', direction: 'up' },
    { label: 'Mobile interaction rate', baseline: '11.4%', target: '16.2%', current: '15.8%', unit: '', direction: 'up' },
    { label: 'Direct order rate on menu pages', baseline: '4.0%', target: '7.4%', current: '5.1%', unit: '', direction: 'up' },
    { label: 'Catering quote-to-booking rate', baseline: '9.0%', target: '11.5%', current: '11.1%', unit: '', direction: 'up' },
    { label: 'Monthly qualified catering leads', baseline: '~8', target: '160+', current: '128', unit: '/ mo', direction: 'up' },
    { label: 'Monthly direct meal orders (website)', baseline: '< 90', target: '1,250+', current: '910', unit: '/ mo', direction: 'up' }
  ],
  notes: 'Friction points, recommended enhancements, implementation priorities, projected uplift figures and technical components are taken verbatim from the Phase 8 CRO sheet; the Social Proof and Trust Signals row is delivered inside Landing Pages, and the Menu Ordering Checkout Flow row is split between the WhatsApp Business API layer and the on-page 1-click button. Impact scores are an agency ranking out of 10, ordered by projected uplift. The phase window closes on 15 Sep 2026; open items on the calculator, checkout and tracking modules carry into the final program fortnight. Current KPI values were read from GA4, the WhatsApp Business API console and kitchen dispatch records on 15 Sep 2026.'
});
