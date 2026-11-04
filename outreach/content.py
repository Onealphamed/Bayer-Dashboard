"""Single source of truth for the outreach copy: templates, therapy tracks, creatives.
Every number below is taken from OneAlphaMed's own collateral on Drive (see offerings_brief.md)."""

DRIVE = "https://drive.google.com/file/d/{}/view"

# ---- Creatives (attach the file; the link is a fallback once sharing is fixed) ----
CREATIVES = {
    "overview":   dict(title="Zoho Emailer 1.png", id="1il6w1D5hscQ4IJ6kfyz6RXAWYVJuoZrw", kind="Overview flyer", size="1.5 MB",
                       shows="3,50,000+ doctors, 15+ specialities, 6,500+ experts", sharing="edit"),
    "whatwedo":   dict(title="What we do 3.png", id="13zaW8vXa5_2jh_L_sGVh_NZuisXIDW9D", kind="Capabilities flyer", size="1.7 MB",
                       shows="Strategy, medical, digital & creative, experiences", sharing="unknown"),
    "hss":        dict(title="Cipla HSS 22 Webinar Series 1 (2).pdf", id="1A31o0WfBnLpC_Y4RgvQ3_efGzq2CaZML", kind="Case study", size="1.3 MB",
                       shows="Healthcare Superstars: 25+ countries, 100,000+ HCPs", sharing="private"),
    "drl":        dict(title="DRL.png", id="1nexWZP2U4k3vmBmgdlB_csmLpebyU12e", kind="Company flyer", size="0.5 MB",
                       shows="360° communication solutions for Dr. Reddy's", sharing="edit"),
    "sun":        dict(title="Sun Flyer 2.png", id="1-ZAtwkaw9zwtyxHkVicnQl5c8qbxE5vn", kind="Company flyer", size="1.8 MB",
                       shows="8 areas of collaboration for Sun Pharma", sharing="private"),
    "resp":       dict(title="Respiratory.png", id="1A9Tl0n3plFrRCZjU8RE5A8Sq-LqAtjog", kind="Therapy flyer", size="1.8 MB",
                       shows="Asthma, COPD, ILD programme formats", sharing="unknown"),
    "oscar":      dict(title="Oscar Case Study.pdf", id="1w-aTkCRJD5PEqET8ACSQnbudlLQCslE6", kind="Case study", size="1.1 MB",
                       shows="RWE study: 10,000 patients, 150 centres", sharing="private"),
    "neuro":      dict(title="Neuropsychiatry 2.png", id="1r3SSNS-zBNu3uGHKHvaCtb5f2LMCflTw", kind="Therapy flyer", size="1.8 MB",
                       shows="15K+ HCPs, 50+ neuroscience programmes", sharing="unknown"),
    "onco":       dict(title="Oncology.png", id="1s283XxZ9h14-cd-u8EnH7UxN7qzYADPt", kind="Therapy flyer", size="2.0 MB",
                       shows="30K+ HCPs, 80+ oncology programmes", sharing="unknown"),
    "women":      dict(title="Women's health.png", id="1kAhs9kGzXniMbn79Cy5DJmzce_UXyxUv", kind="Therapy flyer", size="1.9 MB",
                       shows="20K+ HCPs, 60+ programmes", sharing="unknown"),
    "expo":       dict(title="Zoho Emailer 3.jpg", id="1JxmnChBvzCznUb-zbk2bSF0E5M4kKr3_", kind="Experiential flyer", size="0.2 MB",
                       shows="Booths, AR/VR, lunch symposia", sharing="unknown"),
    "pg":         dict(title="P&G Health Creative.png", id="1l6aKZVexSgdf--5lC6rTCPF44TYzrG7A", kind="Proof creative", size="1.9 MB",
                       shows="UCLH certificate course, 10,000+ doctors certified", sharing="unknown"),
    "kolverse":   dict(title="KOLverse — One-Pager.pdf", id="1uovgwZIPIS2gj4yy6DbSYCsn20qA6SvZ", kind="One-pager", size="0.6 MB",
                       shows="KOL marketplace: verified experts, h-index", sharing="edit"),
    "brochure":   dict(title="Alphamed_Brochure_2026 AUG.pdf", id="1HYfCNzaHqSFeO8MbIhM_gxHIzO0l-iSx", kind="Brochure", size="6.1 MB",
                       shows="All verticals, 18 pages (send only on request)", sharing="unknown"),
}
for c in CREATIVES.values():
    c["url"] = DRIVE.format(c["id"])

# ---- Company-specific opening (credibility line, per the BD playbook) ----
COMPANIES = {
    "Cipla": dict(
        key="cipla", domain="cipla.com", creative="hss",
        subject="{FirstName}, an idea from Cipla's Healthcare Superstars series",
        subject_alt="What we built for Cipla International, for {TeamShort}",
        opener=("Our team produces Healthcare Superstars, the international KOL webinar series for Cipla's "
                "EMEU business. It has reached 100,000+ HCPs across 25+ countries, and the inhaler-adherence "
                "episode drew 4,292 live attendees from 5,679 registrations. We also made the hypertension "
                "KOL video series for Cipla."),
        proof_note="Healthcare Superstars case study (Cipla only)",
    ),
    "Dr. Reddy's": dict(
        key="drl", domain="drreddys.com", creative="drl",
        subject="{FirstName}, building on our work with Dr. Reddy's",
        subject_alt="20 minutes on {TeamShort}'s plans for 2027?",
        opener=("We've been working with Dr. Reddy's Critical Care and Cardiology teams on brand campaigns "
                "and KOL content, and with the vaccines team on a VR-based workshop for paediatricians."),
        proof_note="DRL flyer",
    ),
    "Sun Pharma": dict(
        key="sun", domain="sunpharma.com", creative="sun",
        subject="{FirstName}, from our work with Sun Pharma's Selecta team",
        subject_alt="20 minutes on {TeamShort}'s plans for 2027?",
        opener=("We've worked with Sun Pharma's Selecta team on a KOL case-study booklet series covering "
                "paediatric endocrinology, gastroenterology and rheumatology."),
        proof_note="Sun Pharma flyer",
    ),
    "Torrent Pharma": dict(
        key="torrent", domain="torrentpharma.com", creative="overview",
        subject="{FirstName}, HCP engagement ideas for Torrent",
        subject_alt="20 minutes on {TeamShort}'s plans for 2027?",
        opener=("Marketing teams at Cipla, Sun Pharma and Dr. Reddy's work with us on HCP engagement, from "
                "international KOL webinar series to real-world evidence programmes."),
        proof_note="Overview flyer",
    ),
}

# ---- Therapy / function tracks: matched on title + division, first match wins ----
TRACKS = [
    dict(key="resp", label="Respiratory", team="your respiratory team", creative="resp",
         kw=["resp", "inhal", "asthma", "copd", "foracort", "budecort", "duolin", "seroflo", "asthalin", "alerid", "allergy", "pulmo"],
         line=("For respiratory brands we run multilingual KOL webinar series, inhaler-technique content and "
               "post-event micro-learning. I've attached a one-page summary of the formats.")),
    dict(key="cardio", label="Cardio-diabetes", team="your cardio-diabetes team", creative="oscar",
         kw=["cardio", "vitalis", "diabet", "metab", "cvd", "coronus", "heart", "hypert", "yurpeak", "lipid", "endocr", "renal", "nephro"],
         line=("In cardio-diabetes we ran the OSCAR real-world evidence study on oral semaglutide: 10,000 "
               "patients across 150 centres, ethics approval at every site and a live dashboard for the brand "
               "team. The case study is attached.")),
    dict(key="onco", label="Oncology", team="your oncology team", creative="onco",
         kw=["onco", "cancer", "ciplostem", "haemat", "hemat"],
         line=("In oncology we've engaged 30K+ oncologists and HCPs through 80+ programmes in 25+ cities, and "
               "delivered 289 webinars with 364 KOLs for Bayer. The oncology summary is attached.")),
    dict(key="neuro", label="Neuropsychiatry", team="your neuroscience team", creative="neuro",
         kw=["neuro", "psych", "cns"],
         line=("In neuropsychiatry we've engaged 15K+ neurologists, psychiatrists and physicians through 50+ "
               "scientific programmes. The one-page summary is attached.")),
    dict(key="women", label="Women's health", team="your women's health team", creative="women",
         kw=["women", "fertility", "gyn", "bone", "obstet"],
         line=("In women's health we've engaged 20K+ HCPs through 60+ programmes across 25+ cities. "
               "The summary is attached.")),
    dict(key="derma", label="Dermatology", team="your dermatology team", creative="expo",
         kw=["derma", "skin", "saslic", "cosmet"],
         line=("For dermatology brands we pair KOL content with congress activations: AR/VR, interactive "
               "displays, gamified quizzes and lunch symposia. Our booth and experiential formats are attached.")),
    dict(key="consumer", label="Consumer health", team="your consumer health team", creative="whatwedo",
         kw=["consumer", "omnigel", "prolyte", "otc", "nicotex"],
         line=("For consumer health brands our creative studio handles launch campaigns and retail-ready "
               "creatives, and our AlphaMedX newsletter reaches 3,00,000+ doctors weekly at 20–24% open "
               "rates. An overview is attached.")),
    dict(key="intl", label="International markets", team="your international team", creative="kolverse",
         kw=["international", "emerging", "europe", "emeu", "americas", "global", "export"],
         line=("For international markets, KOLverse gives you 6,500+ experts across 74 countries for faculty "
               "and advisory boards, and we run multilingual webinar programmes in 25+ countries. "
               "The KOLverse one-pager is attached.")),
    dict(key="excel", label="Strategy, excellence & training", team="your team", creative="pg",
         kw=["excellence", "academy", "training", "strateg", "omnichannel", "digital", "communication", "sfe",
             "insight", "foresight", "business development", "licensing", "growth", "learning"],
         line=("For strategy, commercial excellence and training teams, our learning platform ran the P&G Health × UCLH certificate "
               "course, which certified 10,000+ doctors, and our multilingual AI voice agents handle HCP "
               "follow-ups around the clock with every call logged. The P&G programme summary is attached.")),
    dict(key="general", label="General / other", team="your team", creative="overview",
         kw=[],
         line=("Across therapy areas we reach 3,50,000+ doctors in 15+ specialities and run everything from "
               "national CME programmes to international KOL faculty. A one-page overview is attached.")),
]

OFFERINGS = [
    ("Medical education & CME", "webinars, live streaming and certificate courses (10,000+ doctors certified with P&G Health × UCLH)"),
    ("KOLverse", "6,500+ experts across 74 countries for advisory boards, faculty and speaker programmes"),
    ("Real-world evidence", "study set-up to manuscript, e.g. OSCAR: 10,000 patients across 150 centres"),
    ("Omnichannel reach", "3,50,000+ doctors across 15+ specialities via AlphaMedX, email, WhatsApp and microsites"),
    ("Medical content & creative", "scientific writing, case-report compendia, LBLs, MOA and AI videos"),
    ("Congresses & experiential", "booths, AR/VR, interactive displays and lunch symposia"),
    ("AI tools", "multilingual AI voice agents for HCP follow-ups, and a next-gen learning platform"),
]

ASK = ("Would you have 20 minutes in the next two weeks? I'd like to hear what's on {TeamName}'s plan for "
       "2027 and share one or two ideas that fit.")

SIGNATURE = ["Best regards,", "{SenderName}", "{SenderTitle}, OneAlphaMed",
             "info@onealphamed.com  ·  +91 98116 60635  ·  onealphamed.com"]

FOLLOWUPS = [
    dict(day=3, name="Follow-up 1: second proof point", subject="Re: {Subject}",
         body=["Hi {FirstName},",
               "Following up on my note from earlier this week. One example that often resonates: for P&G Health "
               "we built a certificate course with UCLH that certified 10,000+ doctors, with compliance and "
               "learning analytics built in.",
               "Is HCP education something {TeamName} is planning for next year? Happy to share how a similar "
               "programme could work for {Company}."]),
    dict(day=7, name="Follow-up 2: new angle (AI)", subject="An AI idea for {TeamShort}",
         body=["Hi {FirstName},",
               "One more idea, then I'll give your inbox a rest. Our multilingual AI voice agents call HCPs to "
               "follow up after detailing, CMEs and sample drops. They work 24/7 in multiple Indian languages, "
               "and every call is logged for compliance.",
               "Would a 15-minute demo be useful for {TeamName}?"]),
    dict(day=14, name="Follow-up 3: close the loop", subject="Close the loop?",
         body=["Hi {FirstName},",
               "I haven't heard back, so I'll assume the timing isn't right. If it helps later, reply \"later\" "
               "and I'll check in after the new financial year begins.",
               "And if someone else at {Company} looks after HCP engagement for {TeamName}, I'd be grateful "
               "for a pointer."]),
]


def track_for(title, division):
    text = f" {title or ''} {division or ''} ".lower()
    for t in TRACKS:
        if any(k in text for k in t["kw"]):
            return t
    return TRACKS[-1]


def first_email(company, track, cfg=None):
    """Return (subject, list_of_paragraphs, offering_bullets) with {Merge} tags left in."""
    co = COMPANIES[company]
    paras = ["Hi {FirstName},", co["opener"], track["line"]]
    return co["subject"], paras


def render_text(company, track, fill=None):
    """Plain-text email (for Gmail / mail merge)."""
    subject, paras = first_email(company, track)
    lines = [paras[0], "", paras[1], "", paras[2], "", "What we do, in one place:"]
    lines += [f"• {n}: {d}" for n, d in OFFERINGS]
    lines += ["", ASK, ""] + SIGNATURE
    text = "\n".join(lines)
    if fill:
        subject = subject.format(**fill)
        text = text.format(**fill)
    return subject, text
