import json, re, sys, collections
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

sys.path.insert(0, sys.argv[1])
from content import COMPANIES, TRACKS, CREATIVES, FOLLOWUPS, OFFERINGS, ASK, SIGNATURE, track_for, render_text

SRC, OUT = sys.argv[2], sys.argv[3]
rows = json.load(open(SRC))

JUNK_DIV = {"", "generic", "health", "not martketing person", "los", "rural kerala gujrat", "strategy",
            "communication lead", "bd & licensing", "institution division"}
SENDER = {"SenderName": "[Your name]", "SenderTitle": "[Your title]"}


def first_name(r):
    name = re.sub(r"\s+", " ", (r["name"] or "").strip())
    m = re.match(r"^(dr\.?|prof\.?)\s+(.+)$", name, re.I)
    if m:
        return "Dr. " + m.group(2).split(" ")[-1].capitalize()
    parts = [p for p in name.split(" ") if len(p.strip(".")) > 1]
    fn = (parts[0] if parts else (r.get("first_name") or "")).strip()
    return fn[:1].upper() + fn[1:] if fn else ""


def team(r, tr):
    div = (r["division_or_therapy"] or "").strip()
    if div.lower() in JUNK_DIV or len(div) > 40:
        return tr["team"], (tr["label"] if tr["key"] != "general" else r["company"])
    short = " ".join(w if w.isupper() and len(w) <= 4 and w not in ("CIPLA", "RESP") else w.capitalize()
                     for w in re.split(r"\s+", div.replace("–", "-")))
    short = re.sub(r"\s+Team$", "", short, flags=re.I)
    return f"the {short} team", short


def email_ok(r):
    e = (r["email"] or "").strip()
    dom = COMPANIES[r["company"]]["domain"]
    return bool(e) and " " not in e and e.lower().endswith("@" + dom)


def hold_reason(r):
    notes = r["notes"] or ""
    if not (r["email"] or "").strip():
        return "No email in source"
    if " " in r["email"].strip():
        return "Malformed email (stray space)"
    if not email_ok(r):
        return "Email not on company domain"
    if "/" in (r["name"] or ""):
        return "Two names in one cell"
    if "CHECK" in notes:
        return "Flagged: " + notes[notes.find("CHECK"):][:140]
    return ""


waves = collections.defaultdict(list)
for r in rows:
    tr = track_for(r["title"], r["division_or_therapy"])
    tname, tshort = team(r, tr)
    reason = hold_reason(r)
    fill = dict(FirstName=first_name(r) or "there", TeamName=tname, TeamShort=tshort,
                Company=r["company"].replace(" Pharma", "") if r["company"] == "Torrent Pharma" else r["company"],
                **SENDER)
    subj, body = render_text(r["company"], tr, fill)
    co = COMPANIES[r["company"]]
    att = [CREATIVES[co["creative"]]["title"]]
    if CREATIVES[tr["creative"]]["title"] not in att:
        att.append(CREATIVES[tr["creative"]]["title"])
    rec = dict(r, track=tr["label"], team_name=tname, first=fill["FirstName"], subject=subj, body=body,
               attach=" + ".join(att), reason=reason)
    if reason:
        waves["hold"].append(rec)
    elif r["seniority"] in ("CXO/President", "VP/Head", "Sr Manager/GM"):
        waves["w1"].append(rec)
    else:
        waves["w2"].append(rec)

order = {"CXO/President": 0, "VP/Head": 1, "Sr Manager/GM": 2, "Manager/Brand": 3, "Other": 4}
co_order = {c: i for i, c in enumerate(COMPANIES)}
for k in waves:
    waves[k].sort(key=lambda x: (co_order[x["company"]], order.get(x["seniority"], 9), x["name"]))

HEAD_FILL = PatternFill("solid", fgColor="0E3B43")
HEAD_FONT = Font(bold=True, color="FFFFFF")
wb = Workbook()


def sheet(title, headers, data, widths):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for c in ws[1]:
        c.fill, c.font = HEAD_FILL, HEAD_FONT
        c.alignment = Alignment(vertical="center", wrap_text=True)
    for row in data:
        ws.append(row)
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(vertical="top", wrap_text=True)
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = ws.dimensions
    return ws


merge_head = ["Company", "Name", "First name (greeting)", "Title", "Division", "Seniority", "Track", "Email",
              "Phone", "Subject", "Attach", "Email body (plain text)", "BD owner / notes", "Status", "Sent on"]
merge_w = [14, 24, 14, 34, 18, 14, 18, 30, 14, 40, 34, 90, 40, 12, 12]


def merge_rows(lst):
    return [[r["company"], r["name"], r["first"], r["title"], r["division_or_therapy"], r["seniority"], r["track"],
             r["email"], r["phone"], r["subject"], r["attach"], r["body"], r["notes"], "Not sent", ""] for r in lst]


# Read-me sheet
ws = wb.active
ws.title = "Read me"
cnt = lambda k, c: sum(1 for r in waves[k] if r["company"] == c)
lines = [
    ["OneAlphaMed outreach: Cipla, Dr. Reddy's, Sun Pharma, Torrent"],
    ["Built 4 Nov 2026 from Drive: Marketing Contacts- Main, Pharma Marketing Contacts, Cipla_Zydus_Two_Sheets, Marketing Leads."],
    [""],
    ["Before sending"],
    ["1. Replace [Your name] and [Your title] in the Email body column (Find & Replace)."],
    ["2. Attach the files named in the Attach column (they are in Drive; see the Creatives tab). Don't paste Drive links until sharing is fixed."],
    ["3. Send Wave 1 first, a few a day per sender, from the BD owner's own mailbox. Mark Status and Sent on."],
    ["4. Follow-ups go on Day 3, 7 and 14 if there's no reply (Follow-ups tab). Stop as soon as someone replies."],
    [""],
    ["Company", "Wave 1 (senior)", "Wave 2 (managers)", "Hold (check first)", "Total"],
]
for c in COMPANIES:
    a, b, h = cnt("w1", c), cnt("w2", c), cnt("hold", c)
    lines.append([c, a, b, h, a + b + h])
lines.append(["Total", len(waves["w1"]), len(waves["w2"]), len(waves["hold"]), len(rows)])
for l in lines:
    ws.append(l)
ws["A1"].font = Font(bold=True, size=14)
ws["A4"].font = Font(bold=True)
for c in ws[10]:
    c.fill, c.font = HEAD_FILL, HEAD_FONT
ws.column_dimensions["A"].width = 24
for col in "BCDE":
    ws.column_dimensions[col].width = 18

sheet("Wave 1 - Senior", merge_head, merge_rows(waves["w1"]), merge_w)
sheet("Wave 2 - Managers", merge_head, merge_rows(waves["w2"]), merge_w)
sheet("Hold - check first", ["Company", "Name", "Title", "Division", "Seniority", "Email (as in source)", "Phone",
                              "Why on hold", "Source file", "Notes"],
      [[r["company"], r["name"], r["title"], r["division_or_therapy"], r["seniority"], r["email"], r["phone"],
        r["reason"], r["source_file"], r["notes"]] for r in waves["hold"]],
      [14, 24, 34, 18, 14, 30, 14, 40, 30, 50])

tmpl = []
for c in COMPANIES:
    for t in TRACKS:
        s, body = render_text(c, t)
        tmpl.append([c, t["label"], s, COMPANIES[c]["subject_alt"], body])
sheet("Templates", ["Company", "Track", "Subject", "Alternate subject", "Body with {merge fields}"], tmpl, [14, 22, 44, 40, 100])

fu = [[f["day"], f["name"], f["subject"], "\n\n".join(f["body"]) + "\n\n" + "\n".join(SIGNATURE)] for f in FOLLOWUPS]
sheet("Follow-ups", ["Send on day", "Purpose", "Subject", "Body with {merge fields}"], fu, [12, 32, 30, 100])

share = {"private": "Only info@ can open. Share as 'Anyone with the link: Viewer' before linking.",
         "edit": "Anyone with the link can EDIT. Change to Viewer before linking externally.",
         "unknown": "Not checked. Confirm it's Viewer-only before linking."}
cr = [[c["title"], c["kind"], c["shows"], c["size"], c["url"], share[c["sharing"]]] for c in CREATIVES.values()]
sheet("Creatives", ["File", "Type", "What it shows", "Size", "Drive link", "Sharing (checked 4 Nov 2026)"], cr,
      [36, 18, 44, 8, 60, 60])

all_head = ["Company", "Name", "Title", "Division", "Seniority", "Email", "Phone", "LinkedIn", "Track", "Wave", "Source file", "Notes"]
wl = {"w1": "Wave 1", "w2": "Wave 2", "hold": "Hold"}
allrows = [[r["company"], r["name"], r["title"], r["division_or_therapy"], r["seniority"], r["email"], r["phone"],
            r["linkedin"], r["track"], wl[k], r["source_file"], r["notes"]] for k in ("w1", "w2", "hold") for r in waves[k]]
sheet("All contacts", all_head, allrows, [14, 24, 34, 18, 14, 30, 14, 30, 18, 10, 30, 50])

wb.save(OUT)
summary = {c: dict(w1=cnt("w1", c), w2=cnt("w2", c), hold=cnt("hold", c)) for c in COMPANIES}
tracks = collections.Counter((r["company"], r["track"]) for k in ("w1", "w2") for r in waves[k])
json.dump(dict(summary=summary, tracks={f"{a}|{b}": v for (a, b), v in tracks.items()}),
          open(OUT.replace(".xlsx", "_summary.json"), "w"), indent=1)
print(json.dumps(summary, indent=1))
for k, v in sorted(tracks.items()):
    print(k, v)
print("--- sample W1 per company")
seen = set()
for r in waves["w1"]:
    if r["company"] not in seen:
        seen.add(r["company"])
        print("=" * 60, "\nTO:", r["email"], "| ATTACH:", r["attach"], "\nSUBJECT:", r["subject"], "\n" + r["body"])
