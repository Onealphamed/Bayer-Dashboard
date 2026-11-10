"""Build the OneAlphaMed Pricing Master workbook from the extracted proposal data (seed.json)."""
import json, sys, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.chart import BarChart, Reference
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter as CL

SEED, OUT = sys.argv[1], sys.argv[2]
seed = json.load(open(SEED, encoding='utf-8'))

# ---------------------------------------------------------------- constants
MAXM = 600        # last pre-formatted row in Master Pricing Database
MAXC = 200        # last row in catalogue
MAXD = 150        # last row in Source Documents
MAXL = 40         # list length on Lists
QL0, QL1 = 14, 38 # quotation line rows
NAVY, TEAL, BLUE = '0B1F5C', '14A3A8', '1747B5'
F = 'Arial'
f_body = Font(name=F, size=10, color='000000')
f_in = Font(name=F, size=10, color='0000FF')          # hardcoded input
f_link = Font(name=F, size=10, color='008000')        # link to another sheet
f_calc = Font(name=F, size=10, color='000000')        # formula
f_hdr = Font(name=F, size=10, bold=True, color='FFFFFF')
f_title = Font(name=F, size=16, bold=True, color=NAVY)
f_sub = Font(name=F, size=10, italic=True, color='5B6B86')
f_bold = Font(name=F, size=10, bold=True, color=NAVY)
fill_hdr = PatternFill('solid', fgColor=NAVY)
fill_in_hdr = PatternFill('solid', fgColor=BLUE)
fill_input = PatternFill('solid', fgColor='FFF9DB')
fill_kpi = PatternFill('solid', fgColor='EEF3F9')
fill_help = PatternFill('solid', fgColor='F5F8FC')
thin = Side(style='thin', color='E3E9F2')
box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')
center = Alignment(horizontal='center', vertical='center', wrap_text=True)
INR = '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"#,##0'
RATE = '[>=100000]"₹"##\\,##\\,##0;[>=100]"₹"#,##0;"₹"0.00'
PCT = '0%;-0%;0%'
DATE = 'dd-mmm-yyyy'
SHEET = {
    'readme': 'Read Me', 'master': 'Master Pricing Database', 'cat': 'Service & Product Catalogue',
    'hist': 'Historical Pricing', 'quote': 'Quotation Calculator', 'client': 'Client Quotation', 'anal': 'Pricing Analysis',
    'dash': 'Dashboard', 'log': 'Update Log', 'docs': 'Source Documents', 'lists': 'Lists',
}
q = lambda key: "'" + SHEET[key] + "'"

wb = Workbook()
wb.remove(wb.active)
ws = {k: wb.create_sheet(v) for k, v in SHEET.items()}
for s in ws.values():
    s.sheet_view.showGridLines = False

def name(n, sheet_key, ref):
    wb.defined_names[n] = DefinedName(n, attr_text=f"{q(sheet_key)}!{ref}")

def title(s, text, sub):
    s['A1'] = text; s['A1'].font = f_title
    s['A2'] = sub; s['A2'].font = f_sub
    s.row_dimensions[1].height = 26

def header(s, row, headers, widths=None, inputs=()):
    for i, h in enumerate(headers, start=1):
        c = s.cell(row=row, column=i, value=h)
        c.font = f_hdr; c.alignment = center; c.border = box
        c.fill = fill_in_hdr if i in inputs else fill_hdr
    s.row_dimensions[row].height = 32
    if widths:
        for i, w in enumerate(widths, start=1):
            s.column_dimensions[CL(i)].width = w

def put(s, ref, value, font=f_body, fmt=None, fill=None, align=None):
    c = s[ref]; c.value = value; c.font = font; c.border = box
    if fmt: c.number_format = fmt
    if fill: c.fill = fill
    c.alignment = align or Alignment(vertical='top', wrap_text=False)
    return c

def dv_list(s, formula, ref, prompt=None, strict=True):
    d = DataValidation(type='list', formula1=formula, allow_blank=True, showDropDown=False)
    d.error = 'Choose a value from the list (add new values on the Lists sheet).'
    d.errorTitle = 'Not in list'
    d.errorStyle = 'stop' if strict else 'warning'
    if prompt: d.prompt = prompt; d.showInputMessage = True
    s.add_data_validation(d); d.add(ref)

from openpyxl.styles.differential import DifferentialStyle
from openpyxl.formatting.rule import Rule
from openpyxl.styles.numbers import NumberFormat
def pct_rule(s, rng, formula):
    dxf = DifferentialStyle(numFmt=NumberFormat(numFmtId=200, formatCode='0%'))
    s.conditional_formatting.add(rng, Rule(type='expression', dxf=dxf, formula=[formula]))
amber = PatternFill('solid', fgColor='FCE8C3'); red = PatternFill('solid', fgColor='F9D4CF')
green = PatternFill('solid', fgColor='D9F2E1'); grey = PatternFill('solid', fgColor='EEF0F3')
lblue = PatternFill('solid', fgColor='DCE8FB'); lviolet = PatternFill('solid', fgColor='ECE3FB')

# ---------------------------------------------------------------- data preparation
basis_map = {'fixed': 'Fixed', 'percent': 'Percentage', 'at_actuals': 'At actuals', 'quoted_separately': 'Quoted separately'}
type_map = {'actual': 'Actual', 'pass_through': 'Pass-through', 'estimated': 'Estimated'}
cat_name = {c['code']: c['name'] for c in seed['categories']}
svc = {s['code']: s for s in seed['services']}
docs = sorted(seed['documents'], key=lambda d: (d['document_date'], d['key']))
doc_id = {d['key']: f"D{i:02d}" for i, d in enumerate(docs, start=1)}
clients = sorted({d['client'] for d in docs})
PAY_TERMS = [
    ('60% advance on project initiation, 40% on submission of the final handover report', 0.6),
    ('50% advance on project initiation, 50% on submission of all deliverables', 0.5),
    ('60% advance, 40% on final delivery; payment within 45 days of invoice', 0.6),
    ('100% advance on project initiation', 1.0),
    ('100% on submission of all deliverables', 0.0),
    ('Custom (describe in Notes)', None),
]
PENDING = {'VID-002': 'Awaiting OneAlphaMed confirmation that ₹25,000 covers all 30 videos (≈ ₹833 per video). Recommended rate blocked until verified.'}
SUPERSEDED_DOC = {'CIPLA-ISP-2026-06': 'Replaced by D02 (updated version of the same Cipla ISP proposal, 14 Aug 2026)'}

rows = []
for d in docs:
    honor = next((l['amount'] for l in d['lines'] if l['service'] == 'SPK-002'), None)
    for l in d['lines']:
        s = svc[l['service']]
        r = dict(doc=doc_id[d['key']], date=dt.date.fromisoformat(d['document_date']), code=l['service'],
                 scope=l['description'], qty=l['quantity'], rate=l['unit_rate'], quoted=l['amount'],
                 rtype=type_map[l['rate_type']], status='Superseded' if d['key'] in SUPERSEDED_DOC else 'Current',
                 note=SUPERSEDED_DOC.get(d['key'], ''), optional='Yes' if l.get('is_optional') else 'No',
                 curr=l.get('original_currency'), orig=l.get('original_unit_amount'), excerpt=l['source_excerpt'],
                 pct=False, verify='Pending verification' if l['service'] in PENDING else 'As per document',
                 vnote=PENDING.get(l['service']))
        if s['pricing_basis'] == 'percent':      # store as base amount x rate% so Selling Price = Qty x Rate holds
            r['qty'], r['rate'], r['pct'] = honor, l['unit_rate'] / 100, True
            r['scope'] = f"{l['description']} (base: speaker honorarium ₹{honor:,.0f})"
        if l.get('package_size'):
            r['scope'] += f" — package of {l['package_size']} videos"
        rows.append(r)

# ================================================================ Lists & Settings
L = ws['lists']
title(L, 'Lists & Settings', 'Dropdown sources and calculation settings. Add new categories or clients at the end of a list; every dropdown picks them up.')
list_cols = {
    'A': ('Categories', [c['name'] for c in seed['categories']], 'L_Categories'),
    'B': ('Pricing Basis', ['Fixed', 'Percentage', 'At actuals', 'Quoted separately'], 'L_Basis'),
    'C': ('Rate Type', ['Actual', 'Pass-through', 'Estimated'], 'L_RateType'),
    'D': ('Record Status', ['Current', 'Superseded'], 'L_RecStatus'),
    'E': ('Yes / No', ['No', 'Yes'], 'L_YesNo'),
    'F': ('Rate Source (quote)', ['Latest actual', 'Median actual', 'Recommended', 'Foreign currency', 'Manual'], 'L_RateSource'),
    'G': ('Document Status', ['Proposal', 'Accepted', 'Rejected', 'Superseded', 'Invoice', 'Rate card'], 'L_DocStatus'),
    'H': ('Change Type', ['Initial load', 'New record', 'Correction', 'Status change', 'Verification', 'New service', 'New document', 'Quotation issued', 'Setting change', 'Note'], 'L_ChangeType'),
    'I': ('Clients', clients, 'L_Clients'),
    'J': ('Status Filter', ['All', 'Current', 'Superseded'], 'L_HistStatus'),
    'R': ('Verification Status', ['As per document', 'Pending verification', 'Verified by OneAlphaMed'], 'L_Verify'),
    'S': ('Foreign Currency', ['USD', 'EUR', 'GBP'], 'L_Currency'),
}
for col, (h, vals, nm) in list_cols.items():
    put(L, f'{col}4', h, f_hdr, fill=fill_hdr, align=center)
    L.column_dimensions[col].width = 24
    for i, v in enumerate(vals):
        put(L, f'{col}{5 + i}', v, f_in)
    name(nm, 'lists', f'${col}$5:${col}${MAXL}')
# filter lists with an "All" option first, then live references
put(L, 'K4', 'Service Filter', f_hdr, fill=fill_hdr, align=center); L.column_dimensions['K'].width = 46
put(L, 'K5', 'All services', f_in)
for i in range(MAXC - 4):
    put(L, f'K{6 + i}', f"=IF({q('cat')}!$L${5 + i}=\"\",\"\",{q('cat')}!$L${5 + i})", f_link)
name('L_ServiceFilter', 'lists', f'$K$5:$K${5 + MAXC - 4}')
put(L, 'L4', 'Client Filter', f_hdr, fill=fill_hdr, align=center); L.column_dimensions['L'].width = 28
put(L, 'L5', 'All clients', f_in)
for i in range(MAXL - 4):
    put(L, f'L{6 + i}', f'=IF($I${5 + i}="","",$I${5 + i})', f_calc)
name('L_ClientFilter', 'lists', f'$L$5:$L${5 + MAXL - 4}')
# settings
put(L, 'N4', 'Setting', f_hdr, fill=fill_hdr, align=center); put(L, 'O4', 'Value', f_hdr, fill=fill_hdr, align=center)
put(L, 'P4', 'What it controls', f_hdr, fill=fill_hdr, align=center)
L.column_dimensions['N'].width = 30; L.column_dimensions['O'].width = 10; L.column_dimensions['P'].width = 70
settings = [
    ('Inconsistency tolerance', 0.10, 'Tol_Inconsistent', 'A rate that differs from its service average by more than this is flagged; a service whose max/min spread exceeds it is “Inconsistent – review”.'),
    ('Consistency threshold', 0.05, 'Tol_Consistent', 'If a service’s spread is within this, the recommended rate is its latest actual rate; otherwise the median.'),
    ('Default GST rate', 0.18, 'GST_Default', 'GST applied in the Quotation Calculator (as per Government of India norms quoted in every proposal).'),
]
for i, (lab, val, nm, why) in enumerate(settings):
    r = 5 + i
    put(L, f'N{r}', lab, f_bold); put(L, f'O{r}', val, f_in, PCT, fill_input); put(L, f'P{r}', why, f_body, align=wrap)
    name(nm, 'lists', f'$O${r}')
put(L, 'U4', 'Payment Terms', f_hdr, fill=fill_hdr, align=center); put(L, 'V4', 'Advance %', f_hdr, fill=fill_hdr, align=center)
L.column_dimensions['U'].width = 70; L.column_dimensions['V'].width = 11
for i, (t, a) in enumerate(PAY_TERMS):
    put(L, f'U{5 + i}', t, f_in); put(L, f'V{5 + i}', a, f_in, PCT)
for i in range(len(PAY_TERMS), MAXL - 4):
    put(L, f'U{5 + i}', None, f_in); put(L, f'V{5 + i}', None, f_in, PCT)
name('L_PayTerms', 'lists', f'$U$5:$U${MAXL}'); name('L_PayAdvance', 'lists', f'$V$5:$V${MAXL}')
L['U3'] = 'Advance % drives the “Advance on initiation” line. Leave blank for custom terms.'; L['U3'].font = f_sub
L.freeze_panes = 'A5'

# ================================================================ Source Documents
D = ws['docs']
title(D, 'Source Documents — project register', 'One row per pricing document. Original files stay in Google Drive (Proposals folder); links open them. Totals are copied exactly as stated in each document.')
dh = ['Doc ID', 'File Name', 'Client', 'Project', 'Document Date', 'Date Precision', 'Reference No', 'Document Status',
      'Quoted Subtotal (₹, per document)', 'GST (₹, per document)', 'Grand Total (₹, per document)', 'Sum of Lines in Master (₹)',
      'Total Check', 'Payment Terms', 'Validity (days)', 'Drive Link', 'Drive File ID', 'File Type', 'File Size (KB)',
      'Drive Last Modified', 'Notes']
header(D, 4, dh, [8, 44, 20, 40, 13, 10, 18, 13, 16, 14, 16, 16, 22, 34, 9, 14, 36, 8, 9, 18, 60],
       inputs=(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 17, 18, 19, 20, 21))
for i, d in enumerate(docs):
    r = 5 + i
    vals = [doc_id[d['key']], d['title'], d['client'], d['project'], dt.date.fromisoformat(d['document_date']),
            d['date_precision'].capitalize(), d['reference_no'],
            'Superseded' if d['key'] in SUPERSEDED_DOC else 'Proposal',
            d['quoted_subtotal'], d['quoted_gst'], d['quoted_grand_total']]
    for j, v in enumerate(vals, start=1):
        put(D, f'{CL(j)}{r}', v, f_in, DATE if j == 5 else (INR if j in (9, 10, 11) else None))
    put(D, f'N{r}', d['payment_terms'], f_in); put(D, f'O{r}', d['validity_days'], f_in)
    put(D, f'Q{r}', d['drive_file_id'], f_in); put(D, f'R{r}', d['file_type'].upper(), f_in)
    put(D, f'S{r}', round(d['file_size_bytes'] / 1024), f_in, '#,##0')
    put(D, f'T{r}', d['drive_modified'].replace('T', ' ')[:16] + ' UTC', f_in)
    note = d['notes'] or ''
    if d['key'] in SUPERSEDED_DOC: note = (note + ' ' + SUPERSEDED_DOC[d['key']] + '.').strip()
    put(D, f'U{r}', note, f_in, align=wrap)
for r in range(5, MAXD + 1):
    put(D, f'L{r}', f'=IF($A{r}="","",SUMIFS(M_Sell,M_Doc,$A{r},M_Optional,"No"))', f_link, INR)
    put(D, f'M{r}', f'=IF($A{r}="","",IF($I{r}="","No single total in document",IF(ABS($I{r}-$L{r})<=1,"OK","Mismatch: lines ≠ document total")))', f_calc)
    put(D, f'P{r}', f'=IF($Q{r}="","",HYPERLINK("https://drive.google.com/file/d/"&$Q{r}&"/view","Open in Drive"))', f_calc)
    for c in 'ABCDEFGHIJKNOQRSTU':
        if D[f'{c}{r}'].value is None: put(D, f'{c}{r}', None, f_in, DATE if c == 'E' else (INR if c in 'IJK' else None))
for nm, col in [('SD_ID', 'A'), ('SD_File', 'B'), ('SD_Client', 'C'), ('SD_Project', 'D'), ('SD_Date', 'E'), ('SD_Status', 'H'),
                ('SD_Subtotal', 'I'), ('SD_Lines', 'L'), ('SD_Check', 'M'), ('SD_FileID', 'Q')]:
    name(nm, 'docs', f'${col}$5:${col}${MAXD}')
dv_list(D, '=L_Clients', f'C5:C{MAXD}', 'Pick the client (add new clients on the Lists sheet).')
dv_list(D, '=L_DocStatus', f'H5:H{MAXD}')
dv_list(D, '"Day,Month"', f'F5:F{MAXD}')
D.conditional_formatting.add(f'M5:M{MAXD}', FormulaRule(formula=['LEFT($M5,8)="Mismatch"'], fill=red))
D.conditional_formatting.add(f'M5:M{MAXD}', FormulaRule(formula=['$M5="OK"'], fill=green))
D.conditional_formatting.add(f'A5:U{MAXD}', FormulaRule(formula=['$H5="Superseded"'], font=Font(name=F, color='8A94A6', italic=True)))
D.conditional_formatting.add(f'A5:A{MAXD}', FormulaRule(formula=['AND($A5<>"",COUNTIF(SD_ID,$A5)>1)'], fill=red))
D.freeze_panes = 'C5'; D.auto_filter.ref = f'A4:U{MAXD}'

# ================================================================ Service & Product Catalogue
C = ws['cat']
title(C, 'Service & Product Catalogue', 'Standardised list of every offering found in the proposals. Codes are permanent: archive a service instead of deleting or renaming its code.')
ch = ['Code', 'Category', 'Service / Product', 'Standard Unit', 'Pricing Basis', 'Description / Inclusions',
      'Names Used in Documents', 'Status', 'Actual Quotes on Record', 'Price on Record?', 'Duplicate Check', 'Dropdown Label']
header(C, 4, ch, [10, 30, 46, 22, 16, 64, 44, 10, 11, 20, 18, 52], inputs=(1, 2, 3, 4, 5, 6, 7, 8))
for i, s in enumerate(seed['services']):
    r = 5 + i
    vals = [s['code'], cat_name[s['category']], s['name'], s['unit'], basis_map[s['pricing_basis']], s['description'],
            ' | '.join(s['aliases']), 'Active']
    for j, v in enumerate(vals, start=1):
        put(C, f'{CL(j)}{r}', v, f_in, align=wrap if j in (3, 6, 7) else None)
for r in range(5, MAXC + 1):
    for j in range(1, 9):
        if C.cell(row=r, column=j).value is None: put(C, f'{CL(j)}{r}', None, f_in)
    put(C, f'I{r}', f'=IF($A{r}="","",COUNTIFS(M_Code,$A{r},M_Type,"Actual",M_Status,"Current"))', f_link, '0')
    put(C, f'J{r}', f'=IF($A{r}="","",IF($E{r}="Quoted separately","No – quoted separately",IF($I{r}>0,"Yes",IF(COUNTIFS(M_Code,$A{r},M_Type,"Pass-through")>0,"At actuals only","No"))))', f_calc)
    put(C, f'K{r}', f'=IF($A{r}="","",IF(COUNTIF(C_Code,$A{r})>1,"Duplicate code",IF(COUNTIF(C_Name,$C{r})>1,"Duplicate name","")))', f_calc)
    put(C, f'L{r}', f'=IF($A{r}="","",$A{r}&" | "&$C{r})', f_calc)
for nm, col in [('C_Code', 'A'), ('C_Category', 'B'), ('C_Name', 'C'), ('C_Unit', 'D'), ('C_Basis', 'E'), ('C_Status', 'H'), ('C_Label', 'L')]:
    name(nm, 'cat', f'${col}$5:${col}${MAXC}')
dv_list(C, '=L_Categories', f'B5:B{MAXC}')
dv_list(C, '=L_Basis', f'E5:E{MAXC}')
dv_list(C, '"Active,Archived"', f'H5:H{MAXC}')
C.conditional_formatting.add(f'K5:K{MAXC}', FormulaRule(formula=['$K5<>""'], fill=red))
C.conditional_formatting.add(f'J5:J{MAXC}', FormulaRule(formula=['LEFT($J5,2)="No"'], fill=amber))
C.conditional_formatting.add(f'J5:J{MAXC}', FormulaRule(formula=['$J5="Yes"'], fill=green))
C.conditional_formatting.add(f'A5:L{MAXC}', FormulaRule(formula=['$H5="Archived"'], font=Font(name=F, color='8A94A6', italic=True)))
C.freeze_panes = 'D5'; C.auto_filter.ref = f'A4:L{MAXC}'

# ================================================================ Master Pricing Database
M = ws['master']
title(M, 'Master Pricing Database', 'Every price line from every source document. Never overwrite a line: mark it Superseded and add a new row, then log it in the Update Log. Blue columns are inputs; black/green columns are formulas.')
mh = ['Record ID', 'Doc ID', 'Effective Date', 'Client', 'Project', 'Service Code', 'Service', 'Category', 'Scope / Description (as in document)',
      'Pricing Basis', 'Unit', 'Quantity', 'Unit Rate (₹)', 'Selling Price (₹)', 'Quoted Amount in Document (₹)', 'Amount Check',
      'Unit Internal Cost (₹)', 'Total Cost (₹)', 'Margin (₹)', 'Margin %', 'Rate Type', 'Record Status', 'Superseded By / Note',
      'Optional Line?', 'Original Currency', 'Original Unit Amount', 'FX Rate (₹ per unit)', 'Source Excerpt (verbatim)',
      'Duplicate Check', 'Consistency Check', 'FX Check', 'Entered By', 'Entered On', 'Verification Status', 'Verification Note', 'History Key (helper)']
INPUT_COLS = (1, 2, 3, 6, 9, 12, 13, 15, 17, 21, 22, 23, 24, 25, 26, 28, 32, 33, 34, 35)
header(M, 4, mh, [10, 7, 12, 18, 30, 9, 34, 22, 48, 11, 16, 11, 12, 14, 14, 16, 12, 12, 12, 9, 12, 11, 34, 9, 9, 11, 10, 56, 16, 26, 26, 14, 12, 19, 40, 8],
       inputs=INPUT_COLS)
M['A3'] = 'Rate types: Actual = client-facing price quoted in a document · Pass-through = billed at actuals (e.g. speaker honorarium) · Estimated = internal estimate, not yet quoted. Recommended rates are calculated on Pricing Analysis and are never stored here.'
M['A3'].font = Font(name=F, size=9, italic=True, color='5B6B86')
for i, rr in enumerate(rows):
    r = 5 + i
    put(M, f'A{r}', f'PR-{i + 1:04d}', f_in); put(M, f'B{r}', rr['doc'], f_in); put(M, f'C{r}', rr['date'], f_in, DATE)
    put(M, f'F{r}', rr['code'], f_in); put(M, f'I{r}', rr['scope'], f_in)
    put(M, f'L{r}', rr['qty'], f_in, '#,##0.##'); put(M, f'M{r}', rr['rate'], f_in, '0%' if rr['pct'] else RATE)
    put(M, f'O{r}', rr['quoted'], f_in, INR); put(M, f'U{r}', rr['rtype'], f_in); put(M, f'V{r}', rr['status'], f_in)
    put(M, f'W{r}', rr['note'] or None, f_in); put(M, f'X{r}', rr['optional'], f_in)
    if rr['curr']:
        put(M, f'Y{r}', rr['curr'], f_in); put(M, f'Z{r}', rr['orig'], f_in, '#,##0')
    put(M, f'AB{r}', rr['excerpt'], f_in)
    put(M, f'AF{r}', 'Initial consolidation', f_in); put(M, f'AG{r}', dt.date(2026, 11, 10), f_in, DATE)
    put(M, f'AH{r}', rr['verify'], f_in); put(M, f'AI{r}', rr['vnote'], f_in)
for r in range(5, MAXM + 1):
    for j in INPUT_COLS:
        ref = f'{CL(j)}{r}'
        if M[ref].value is None:
            fmt = DATE if j in (3, 33) else (RATE if j == 13 else (INR if j in (15, 17) else ('#,##0.##' if j == 12 else None)))
            put(M, ref, None, f_in, fmt)
    put(M, f'D{r}', f'=IF($B{r}="","",IFERROR(INDEX(SD_Client,MATCH($B{r},SD_ID,0)),"Doc ID not found"))', f_link)
    put(M, f'E{r}', f'=IF($B{r}="","",IFERROR(INDEX(SD_Project,MATCH($B{r},SD_ID,0)),""))', f_link)
    put(M, f'G{r}', f'=IF($F{r}="","",IFERROR(INDEX(C_Name,MATCH($F{r},C_Code,0)),"Code not in catalogue"))', f_link)
    put(M, f'H{r}', f'=IF($F{r}="","",IFERROR(INDEX(C_Category,MATCH($F{r},C_Code,0)),""))', f_link)
    put(M, f'J{r}', f'=IF($F{r}="","",IFERROR(INDEX(C_Basis,MATCH($F{r},C_Code,0)),""))', f_link)
    put(M, f'K{r}', f'=IF($F{r}="","",IFERROR(INDEX(C_Unit,MATCH($F{r},C_Code,0)),""))', f_link)
    put(M, f'N{r}', f'=IF(OR($L{r}="",$M{r}=""),"",$L{r}*$M{r})', f_calc, INR)
    put(M, f'P{r}', f'=IF(OR($O{r}="",$N{r}=""),"",IF(ABS($O{r}-$N{r})<=1,"OK","Mismatch: document shows "&TEXT($O{r},"#,##0")))', f_calc)
    put(M, f'R{r}', f'=IF(OR($Q{r}="",$L{r}=""),"",$L{r}*$Q{r})', f_calc, INR)
    put(M, f'S{r}', f'=IF(OR($R{r}="",$N{r}=""),"",$N{r}-$R{r})', f_calc, INR)
    put(M, f'T{r}', f'=IF(OR($S{r}="",$N{r}="",$N{r}=0),"",$S{r}/$N{r})', f_calc, '0.0%')
    put(M, f'AA{r}', f'=IF(OR($Y{r}="",$Z{r}="",$Z{r}=0,$M{r}=""),"",$M{r}/$Z{r})', f_calc, '0.00')
    put(M, f'AC{r}', f'=IF($F{r}="","",IF(COUNTIF(M_RecID,$A{r})>1,"Duplicate Record ID",IF(COUNTIFS(M_Doc,$B{r},M_Code,$F{r},M_Qty,$L{r},M_Rate,$M{r},M_Type,$U{r},M_Status,$V{r})>1,"Duplicate entry","")))', f_calc)
    avg = f'AVERAGEIFS(M_Rate,M_Code,$F{r},M_Type,"Actual",M_Status,"Current")'
    put(M, f'AD{r}', f'=IF(OR($F{r}="",$M{r}="",$U{r}<>"Actual",$V{r}<>"Current"),"",IF(ABS($M{r}/{avg}-1)>Tol_Inconsistent,"Differs from service average by "&TEXT($M{r}/{avg}-1,"+0%;-0%"),""))', f_calc)
    fxmax = f'_xlfn.MAXIFS(M_FX,M_Curr,$Y{r},M_Status,"Current")'
    fxmin = f'_xlfn.MINIFS(M_FX,M_Curr,$Y{r},M_Status,"Current")'
    put(M, f'AE{r}', f'=IF(OR($AA{r}="",$V{r}<>"Current"),"",IF({fxmax}<>{fxmin},"FX rate for "&$Y{r}&" differs across documents (₹"&TEXT({fxmin},"0.00")&" to ₹"&TEXT({fxmax},"0.00")&")",""))', f_calc)
    put(M, f'AJ{r}', f'=IF(AND($F{r}<>"",OR(HP_Code="",$F{r}=HP_Code),OR(HP_Client="All clients",$D{r}=HP_Client),OR(HP_Status="All",$V{r}=HP_Status)),MAX($AJ$4:$AJ{r - 1})+1,"")', Font(name=F, size=9, color='8A94A6'))
for nm, col in [('M_RecID', 'A'), ('M_Doc', 'B'), ('M_Date', 'C'), ('M_Client', 'D'), ('M_Project', 'E'), ('M_Code', 'F'), ('M_Service', 'G'),
                ('M_Category', 'H'), ('M_Scope', 'I'), ('M_Basis', 'J'), ('M_Unit', 'K'), ('M_Qty', 'L'), ('M_Rate', 'M'), ('M_Sell', 'N'),
                ('M_Quoted', 'O'), ('M_AmtCheck', 'P'), ('M_UnitCost', 'Q'), ('M_TotCost', 'R'), ('M_Margin', 'S'), ('M_MarginPct', 'T'),
                ('M_Type', 'U'), ('M_Status', 'V'), ('M_Note', 'W'), ('M_Optional', 'X'), ('M_Curr', 'Y'), ('M_OrigAmt', 'Z'), ('M_FX', 'AA'),
                ('M_Excerpt', 'AB'), ('M_Dup', 'AC'), ('M_Consist', 'AD'), ('M_FXFlag', 'AE'), ('M_Verify', 'AH'), ('M_VerifyNote', 'AI'), ('M_HistKey', 'AJ')]:
    name(nm, 'master', f'${col}$5:${col}${MAXM}')
dv_list(M, '=SD_ID', f'B5:B{MAXM}', 'Doc ID from the Source Documents sheet. Leave blank only for Estimated rates.')
dv_list(M, '=C_Code', f'F5:F{MAXM}', 'Service code from the catalogue.')
dv_list(M, '=L_RateType', f'U5:U{MAXM}')
dv_list(M, '=L_RecStatus', f'V5:V{MAXM}')
dv_list(M, '=L_YesNo', f'X5:X{MAXM}')
dv_list(M, '=L_Verify', f'AH5:AH{MAXM}', 'As per document = copied from the source; Pending verification = do not reuse until confirmed.')
M.conditional_formatting.add(f'AH5:AH{MAXM}', FormulaRule(formula=['$AH5="Pending verification"'], fill=amber, font=Font(name=F, bold=True, color='9A5B00')))
M.conditional_formatting.add(f'M5:M{MAXM}', FormulaRule(formula=['$AH5="Pending verification"'], fill=amber))
dnum = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True)
dnum.error = 'Enter a number ≥ 0 (no text, no ₹ sign).'; M.add_data_validation(dnum)
for col in 'LMOQZ': dnum.add(f'{col}5:{col}{MAXM}')
ddate = DataValidation(type='date', operator='greaterThan', formula1='36526', allow_blank=True)
ddate.error = 'Enter a date (e.g. 10-Nov-2026).'; M.add_data_validation(ddate); ddate.add(f'C5:C{MAXM}')
M.conditional_formatting.add(f'A5:AJ{MAXM}', FormulaRule(formula=['$V5="Superseded"'], font=Font(name=F, color='8A94A6', italic=True)))
pct_rule(M, f'M5:M{MAXM}', '$J5="Percentage"')
M.conditional_formatting.add(f'P5:P{MAXM}', FormulaRule(formula=['LEFT($P5,8)="Mismatch"'], fill=red))
M.conditional_formatting.add(f'AC5:AE{MAXM}', FormulaRule(formula=['AC5<>""'], fill=amber))
M.conditional_formatting.add(f'U5:U{MAXM}', FormulaRule(formula=['$U5="Pass-through"'], fill=lblue))
M.conditional_formatting.add(f'U5:U{MAXM}', FormulaRule(formula=['$U5="Estimated"'], fill=lviolet))
M.conditional_formatting.add(f'B5:B{MAXM}', FormulaRule(formula=['AND($F5<>"",$U5="Actual",$B5="")'], fill=red))
M.conditional_formatting.add(f'D5:K{MAXM}', FormulaRule(formula=['OR(D5="Doc ID not found",D5="Code not in catalogue")'], fill=red))
M.freeze_panes = 'G5'; M.auto_filter.ref = f'A4:AJ{MAXM}'
M['B4'].comment = Comment('Actual rates must cite a Doc ID (red if missing).', 'Pricing Master')
M['M4'].comment = Comment('Selling rate per unit, exactly as in the document. For Percentage lines enter the % (e.g. 10%) and put the base amount in Quantity.', 'Pricing Master')
M['Q4'].comment = Comment('Internal cost per unit. None of the 11 source documents contains internal costs, so this is blank until you enter real costs. Margin columns fill in automatically.', 'Pricing Master')

# ================================================================ Historical Pricing (filtered view)
H = ws['hist']
title(H, 'Historical Pricing', 'Previous project rates with dates and source references. Choose a service, client and status; the list fills from the Master Pricing Database (in entry order, which is by document date).')
put(H, 'A3', 'Service', f_bold); put(H, 'C3', 'All services', f_in, fill=fill_input)
put(H, 'G3', 'Client', f_bold); put(H, 'H3', 'All clients', f_in, fill=fill_input)
put(H, 'J3', 'Status', f_bold); put(H, 'K3', 'Current', f_in, fill=fill_input)
H.merge_cells('C3:F3')
put(H, 'M3', 'Matching records', f_bold); put(H, 'N3', '=MAX(M_HistKey)', f_calc, '0')
put(H, 'P3', '=IF($C$3="All services","",LEFT($C$3,FIND(" | ",$C$3)-1))', Font(name=F, size=9, color='8A94A6'))
name('HP_Code', 'hist', '$P$3'); name('HP_Client', 'hist', '$H$3'); name('HP_Status', 'hist', '$K$3')
dv_list(H, '=L_ServiceFilter', 'C3'); dv_list(H, '=L_ClientFilter', 'H3'); dv_list(H, '=L_HistStatus', 'K3')
hh = ['#', 'Record ID', 'Date', 'Client', 'Project', 'Service Code', 'Service', 'Unit', 'Quantity', 'Unit Rate (₹)', 'Selling Price (₹)',
      'Rate Type', 'Status', 'vs Service Average', 'Source Document', 'Source Excerpt', 'Drive Link', 'Verification']
header(H, 6, hh, [5, 10, 12, 18, 30, 9, 36, 16, 11, 12, 14, 12, 11, 11, 40, 56, 13, 19])
H.column_dimensions['P'].width = 56
src = {'B': 'M_RecID', 'C': 'M_Date', 'D': 'M_Client', 'E': 'M_Project', 'F': 'M_Code', 'G': 'M_Service', 'H': 'M_Unit',
       'I': 'M_Qty', 'J': 'M_Rate', 'K': 'M_Sell', 'L': 'M_Type', 'M': 'M_Status', 'P': 'M_Excerpt', 'R': 'M_Verify'}
for k in range(1, MAXM - 4 + 1):
    r = 6 + k
    put(H, f'A{r}', f'=IF({k}<=MAX(M_HistKey),{k},"")', f_calc, '0')
    m = f'MATCH($A{r},M_HistKey,0)'
    for col, nm in src.items():
        fmt = DATE if col == 'C' else (RATE if col == 'J' else (INR if col == 'K' else ('#,##0.##' if col == 'I' else None)))
        put(H, f'{col}{r}', f'=IF($A{r}="","",INDEX({nm},{m})&"")' if col not in 'CIJK' else f'=IF($A{r}="","",INDEX({nm},{m}))', f_link, fmt)
    put(H, f'N{r}', f'=IF(OR($A{r}="",$L{r}<>"Actual"),"",IFERROR($J{r}/AVERAGEIFS(M_Rate,M_Code,$F{r},M_Type,"Actual",M_Status,"Current")-1,""))', f_calc, '+0%;-0%;0%')
    put(H, f'O{r}', f'=IF($A{r}="","",IFERROR(INDEX(SD_File,MATCH(INDEX(M_Doc,{m}),SD_ID,0)),"No document"))', f_link)
    put(H, f'Q{r}', f'=IF($A{r}="","",IFERROR(HYPERLINK("https://drive.google.com/file/d/"&INDEX(SD_FileID,MATCH(INDEX(M_Doc,{m}),SD_ID,0))&"/view","Open in Drive"),""))', f_calc)
H.conditional_formatting.add(f'J7:J{MAXM + 2}', FormulaRule(formula=['$J7<>""'], font=Font(name=F, bold=True, color=NAVY)))
# percentage rows show as % (unit rate < 1 on a Percentage service)
H.conditional_formatting.add(f'N7:N{MAXM + 2}', FormulaRule(formula=['AND(ISNUMBER($N7),ABS($N7)>Tol_Inconsistent)'], fill=amber))
H.conditional_formatting.add(f'A7:Q{MAXM + 2}', FormulaRule(formula=['$M7="Superseded"'], font=Font(name=F, color='8A94A6', italic=True)))
pct_rule(H, f'J7:J{MAXM + 2}', 'INDEX(C_Basis,MATCH($F7,C_Code,0))="Percentage"')
H.freeze_panes = 'C7'; H.auto_filter.ref = f'A6:R{MAXM + 2}'
H.conditional_formatting.add(f'R7:R{MAXM + 2}', FormulaRule(formula=['$R7="Pending verification"'], fill=amber))

# ================================================================ Pricing Analysis
A = ws['anal']
title(A, 'Pricing Analysis', 'Minimum, maximum, average and median of ACTUAL current rates per service, with a formula-based recommended rate and margin analysis. Pass-through and estimated rates are shown separately.')
ah = ['Code', 'Service', 'Unit', 'Pricing Basis', 'Actual Quotes (#)', 'Min Rate (₹)', 'Max Rate (₹)', 'Average Rate (₹)', 'Median Rate (₹)',
      'Latest Quote Date', 'Latest Rate (₹)', 'Spread (Max ÷ Min − 1)', 'Consistency', 'RECOMMENDED Rate (₹)', 'Recommendation Method',
      'Confidence', 'Pass-through Min (₹)', 'Pass-through Max (₹)', 'Estimated Rates (#)', 'Estimated Average (₹)',
      'Avg Unit Internal Cost (₹)', 'Avg Margin %', 'Min Margin %', 'Quoted Value, Actual (₹)', 'Lines Pending Verification']
header(A, 5, ah, [9, 40, 18, 13, 9, 12, 12, 12, 12, 12, 12, 11, 20, 15, 22, 11, 14, 14, 10, 13, 14, 12, 12, 15, 12])
A['A3'] = ('Recommended rate rule: no actual data or any line pending verification → no recommendation · spread ≤ Consistency threshold (Lists) → latest actual rate · otherwise → median. '
           'Confidence: High = 3+ consistent quotes; Medium = 2+ quotes; Low = 1 quote. The recommendation never goes outside the observed min–max.')
A['A3'].font = Font(name=F, size=9, italic=True, color='5B6B86')
A.merge_cells('A3:X3'); A['A3'].alignment = wrap; A.row_dimensions[3].height = 28
AR0, AR1 = 6, 6 + (MAXC - 5)
crit = lambda r: f'M_Code,$A{r},M_Type,"Actual",M_Status,"Current"'
for i in range(MAXC - 4):
    r, cr = AR0 + i, 5 + i
    put(A, f'A{r}', f"=IF({q('cat')}!$A{cr}=\"\",\"\",{q('cat')}!$A{cr})", f_link)
    put(A, f'B{r}', f"=IF($A{r}=\"\",\"\",{q('cat')}!$C{cr})", f_link)
    put(A, f'C{r}', f"=IF($A{r}=\"\",\"\",{q('cat')}!$D{cr})", f_link)
    put(A, f'D{r}', f"=IF($A{r}=\"\",\"\",{q('cat')}!$E{cr})", f_link)
    put(A, f'E{r}', f'=IF($A{r}="","",COUNTIFS({crit(r)}))', f_calc, '0')
    put(A, f'F{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",_xlfn.MINIFS(M_Rate,{crit(r)}))', f_calc, RATE)
    put(A, f'G{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",_xlfn.MAXIFS(M_Rate,{crit(r)}))', f_calc, RATE)
    put(A, f'H{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",AVERAGEIFS(M_Rate,{crit(r)}))', f_calc, RATE)
    put(A, f'I{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",_xlfn.AGGREGATE(17,6,M_Rate/((M_Code=$A{r})*(M_Type="Actual")*(M_Status="Current")),2))', f_calc, RATE)
    put(A, f'J{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",_xlfn.MAXIFS(M_Date,{crit(r)}))', f_calc, DATE)
    put(A, f'K{r}', f'=IF(OR($A{r}="",N($E{r})=0),"",AVERAGEIFS(M_Rate,{crit(r)},M_Date,$J{r}))', f_calc, RATE)
    put(A, f'L{r}', f'=IF(OR($A{r}="",N($E{r})=0,N($F{r})=0),"",$G{r}/$F{r}-1)', f_calc, PCT)
    put(A, f'M{r}', f'=IF($A{r}="","",IF($D{r}="Quoted separately","No price on record",IF($E{r}=0,IF(COUNTIFS(M_Code,$A{r},M_Type,"Pass-through",M_Status,"Current")>0,"Pass-through only","No actual data"),IF($E{r}=1,"Single quote",IF($L{r}>Tol_Inconsistent,"Inconsistent – review","Consistent")))))', f_calc)
    put(A, f'N{r}', f'=IF($A{r}="","",IF(N($Y{r})>0,"Pending verification",IF($D{r}="Quoted separately","No price on record",IF($D{r}="At actuals","At actuals",IF($E{r}=0,"No data",IF(N($L{r})<=Tol_Consistent,$K{r},$I{r}))))))', Font(name=F, size=10, bold=True, color=NAVY), RATE)
    put(A, f'O{r}', f'=IF(N($Y{r})>0,"Blocked until the rate is verified",IF(NOT(ISNUMBER($N{r})),"",IF($E{r}=1,"Single quote",IF(N($L{r})<=Tol_Consistent,"Latest (rates consistent)","Median (rates vary)"))))', f_calc)
    put(A, f'P{r}', f'=IF(NOT(ISNUMBER($N{r})),"",IF(AND($E{r}>=3,N($L{r})<=Tol_Consistent),"High",IF($E{r}>=2,"Medium","Low")))', f_calc)
    pt = f'M_Code,$A{r},M_Type,"Pass-through",M_Status,"Current"'
    put(A, f'Q{r}', f'=IF($A{r}="","",IF(COUNTIFS({pt})=0,"",_xlfn.MINIFS(M_Rate,{pt})))', f_calc, INR)
    put(A, f'R{r}', f'=IF($A{r}="","",IF(COUNTIFS({pt})=0,"",_xlfn.MAXIFS(M_Rate,{pt})))', f_calc, INR)
    es = f'M_Code,$A{r},M_Type,"Estimated",M_Status,"Current"'
    put(A, f'S{r}', f'=IF($A{r}="","",COUNTIFS({es}))', f_calc, '0')
    put(A, f'T{r}', f'=IF(OR($A{r}="",N($S{r})=0),"",AVERAGEIFS(M_Rate,{es}))', f_calc, RATE)
    put(A, f'U{r}', f'=IF($A{r}="","",IF(COUNTIFS(M_Code,$A{r},M_Status,"Current",M_UnitCost,">=0")=0,"No cost data",AVERAGEIFS(M_UnitCost,M_Code,$A{r},M_Status,"Current",M_UnitCost,">=0")))', f_calc, RATE)
    mc = f'M_Code,$A{r},M_Type,"Actual",M_Status,"Current",M_MarginPct,">-1000"'
    put(A, f'V{r}', f'=IF($A{r}="","",IF(COUNTIFS({mc})=0,"No cost data",AVERAGEIFS(M_MarginPct,{mc})))', f_calc, '0.0%')
    put(A, f'W{r}', f'=IF($A{r}="","",IF(COUNTIFS({mc})=0,"No cost data",_xlfn.MINIFS(M_MarginPct,{mc})))', f_calc, '0.0%')
    put(A, f'X{r}', f'=IF($A{r}="","",SUMIFS(M_Sell,{crit(r)},M_Optional,"No"))', f_calc, INR)
    put(A, f'Y{r}', f'=IF($A{r}="","",COUNTIFS({crit(r)},M_Verify,"Pending verification"))', f_calc, '0')
for nm, col in [('A_Code', 'A'), ('A_Service', 'B'), ('A_Count', 'E'), ('A_Min', 'F'), ('A_Max', 'G'), ('A_Median', 'I'), ('A_Latest', 'K'),
                ('A_Consist', 'M'), ('A_Rec', 'N'), ('A_Value', 'X'), ('A_Pending', 'Y')]:
    name(nm, 'anal', f'${col}${AR0}:${col}${AR1}')
A.conditional_formatting.add(f'M{AR0}:M{AR1}', FormulaRule(formula=[f'LEFT($M{AR0},12)="Inconsistent"'], fill=amber))
A.conditional_formatting.add(f'M{AR0}:M{AR1}', FormulaRule(formula=[f'$M{AR0}="Consistent"'], fill=green))
A.conditional_formatting.add(f'M{AR0}:M{AR1}', FormulaRule(formula=[f'OR($M{AR0}="No price on record",$M{AR0}="No actual data")'], fill=grey))
A.conditional_formatting.add(f'P{AR0}:P{AR1}', FormulaRule(formula=[f'$P{AR0}="High"'], fill=green))
A.conditional_formatting.add(f'P{AR0}:P{AR1}', FormulaRule(formula=[f'$P{AR0}="Medium"'], fill=amber))
A.conditional_formatting.add(f'P{AR0}:P{AR1}', FormulaRule(formula=[f'$P{AR0}="Low"'], fill=red))
A.conditional_formatting.add(f'N{AR0}:N{AR1}', FormulaRule(formula=[f'ISNUMBER($N{AR0})'], fill=PatternFill('solid', fgColor='E6F4F4')))
# percentage-basis services: show rates as %
pct_rule(A, f'F{AR0}:K{AR1}', f'$D{AR0}="Percentage"'); pct_rule(A, f'N{AR0}:N{AR1}', f'$D{AR0}="Percentage"'); pct_rule(A, f'T{AR0}:T{AR1}', f'$D{AR0}="Percentage"')
# client x service comparison matrix
MX0 = 26  # column Z
put(A, f'{CL(MX0)}4', 'Average actual unit rate by client (₹) — compare pricing across clients', f_bold)
put(A, f'{CL(MX0)}5', 'Code', f_hdr, fill=fill_hdr, align=center)
A.column_dimensions[CL(MX0)].width = 9
for j in range(12):
    col = CL(MX0 + 1 + j)
    put(A, f'{col}5', f'=IF(INDEX(L_Clients,{j + 1})="","",INDEX(L_Clients,{j + 1}))', f_hdr, fill=fill_hdr, align=center)
    A.column_dimensions[col].width = 14
for i in range(MAXC - 4):
    r = AR0 + i
    put(A, f'{CL(MX0)}{r}', f'=$A{r}', f_calc)
    for j in range(12):
        col = CL(MX0 + 1 + j)
        put(A, f'{col}{r}', f'=IF(OR($A{r}="",{col}$5=""),"",IFERROR(AVERAGEIFS(M_Rate,M_Code,$A{r},M_Client,{col}$5,M_Type,"Actual",M_Status,"Current"),""))', f_calc, RATE)
A.conditional_formatting.add(f'{CL(MX0 + 1)}{AR0}:{CL(MX0 + 12)}{AR1}',
    FormulaRule(formula=[f'AND(ISNUMBER({CL(MX0 + 1)}{AR0}),ISNUMBER(INDEX(A_Median,ROW()-{AR0 - 1})),ABS({CL(MX0 + 1)}{AR0}/INDEX(A_Median,ROW()-{AR0 - 1})-1)>Tol_Inconsistent)'], fill=amber))
A.conditional_formatting.add(f'N{AR0}:O{AR1}', FormulaRule(formula=[f'N($Y{AR0})>0'], fill=amber))
A.conditional_formatting.add(f'Y{AR0}:Y{AR1}', CellIsRule(operator='greaterThan', formula=['0'], fill=amber))
A.freeze_panes = 'C6'; A.auto_filter.ref = f'A5:Y{AR1}'

# ================================================================ Quotation Calculator
Q = ws['quote']
title(Q, 'Quotation Calculator', 'Internal working sheet. Yellow cells are inputs. Totals, discount and GST calculate here; the Client Quotation sheet fills in automatically for PDF or Excel export.')
QL0, QL1 = 17, 36
for c, w in zip('ABCDEFGHIJKLMNOP', [5, 50, 9, 16, 13, 17, 13, 10, 12, 14, 14, 16, 46, 24, 44, 7]):
    Q.column_dimensions[c].width = w
QH = [('Client', 'Example client (overwrite)', None, 'Q_Client'), ('Attention (contact)', None, None, 'Q_Attn'),
      ('Project', 'International Speaker Programme – example', None, 'Q_Project'), ('Quote Date', dt.date(2026, 11, 10), DATE, 'Q_Date'),
      ('Quote Reference', 'OAM-Q-2026-0001', None, 'Q_Ref'), ('Validity (days)', 15, '0', 'Q_Validity'),
      ('Payment Terms', PAY_TERMS[1][0], None, 'Q_Terms'), ('GST Rate', '=GST_Default', PCT, 'Q_GSTRate'),
      ('Discount %', 0, '0.0%', 'Q_DiscPct'), ('Discount Amount (₹) – optional', None, INR, 'Q_DiscAmt')]
for i, (lab, val, fmt, nm) in enumerate(QH):
    r = 4 + i
    put(Q, f'B{r}', lab, f_bold)
    put(Q, f'C{r}', val, f_link if isinstance(val, str) and val.startswith('=') else f_in, fmt, fill_input, Alignment(horizontal='left', vertical='top', wrap_text=True))
    for c in 'DE': put(Q, f'{c}{r}', None, f_in, fill=fill_input)
    Q.merge_cells(f'C{r}:E{r}')
    name(nm, 'quote', f'$C${r}')
Q.row_dimensions[10].height = 30
dv_list(Q, '=L_PayTerms', 'C10', 'Pick standard terms, or type your own (custom terms show no advance amount).', strict=False)
dpct = DataValidation(type='decimal', operator='between', formula1='0', formula2='1', allow_blank=True)
dpct.error = 'Enter a percentage between 0% and 100%.'; Q.add_data_validation(dpct); dpct.add('C11'); dpct.add('C12')
damt = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True)
damt.error = 'Enter an amount ≥ 0.'; Q.add_data_validation(damt); damt.add('C13')
dval = DataValidation(type='whole', operator='greaterThan', formula1='0', allow_blank=True); Q.add_data_validation(dval); dval.add('C9')
dqd = DataValidation(type='date', operator='greaterThan', formula1='36526', allow_blank=False); Q.add_data_validation(dqd); dqd.add('C7')
# exchange rates on quote date (never assumed)
put(Q, 'G4', 'EXCHANGE RATES ON QUOTE DATE', f_hdr, fill=fill_hdr)
for c in 'HIJ': put(Q, f'{c}4', None, f_hdr, fill=fill_hdr)
for c, h in zip('GHIJ', ['Currency', '₹ per unit', 'Rate date', 'Source']):
    put(Q, f'{c}5', h, f_hdr, fill=fill_in_hdr, align=center)
for i, cur in enumerate(['USD', 'EUR', 'GBP']):
    r = 6 + i
    put(Q, f'G{r}', cur, f_in); put(Q, f'H{r}', None, f_in, '0.00', fill_input)
    put(Q, f'I{r}', None, f_in, DATE, fill_input); put(Q, f'J{r}', None, f_in, fill=fill_input)
name('FX_Cur', 'quote', '$G$6:$G$8'); name('FX_Rate', 'quote', '$H$6:$H$8')
dfx = DataValidation(type='decimal', operator='greaterThan', formula1='0', allow_blank=True)
dfx.error = 'Enter the exchange rate in ₹ per unit of foreign currency.'; Q.add_data_validation(dfx); dfx.add('H6:H8')
put(Q, 'G9', 'Enter the actual rate applicable on the quote date (e.g. RBI reference rate). The workbook never assumes a rate; historical ₹96 / ₹98 stay unchanged in the Master.', f_sub, align=wrap)
Q.merge_cells('G9:N10')
put(Q, 'G11', f'=IF(COUNTIFS($F${QL0}:$F${QL1},"Foreign currency",$K${QL0}:$K${QL1},"")>0,"Enter the exchange rate for: "&IF(COUNTIFS($H${QL0}:$H${QL1},"USD",$K${QL0}:$K${QL1},"")>0,"USD ","")&IF(COUNTIFS($H${QL0}:$H${QL1},"EUR",$K${QL0}:$K${QL1},"")>0,"EUR ","")&IF(COUNTIFS($H${QL0}:$H${QL1},"GBP",$K${QL0}:$K${QL1},"")>0,"GBP",""),"")', Font(name=F, size=10, bold=True, color='9A5B00'))
Q.conditional_formatting.add('G11', FormulaRule(formula=['$G$11<>""'], fill=amber))
# line table
qh = ['#', 'Service (pick from list)', 'Code', 'Unit', 'Pricing Basis', 'Rate Source', 'Manual Rate (₹ or %)', 'Foreign Currency',
      'Foreign Amount per Unit', 'Quantity (base ₹ for % lines)', 'Unit Rate Used (₹)', 'Amount (₹)', 'Rate Note',
      'Historical Range (actual)', 'Client Description (optional)', 'Line # (helper)']
header(Q, QL0 - 1, qh, inputs=(2, 6, 7, 8, 9, 10, 15))
example = [
    ('SPK-001', 'Latest actual', None, None, None, 1, 'International speaker onboarding and co-ordination on content and compliance documents'),
    ('SPK-002', 'Foreign currency', None, 'USD', 3000, 1, 'Speaker honorarium (US$3,000) – billed at actuals'),
    ('SPK-003', 'Latest actual', None, None, None, f'=L{QL0 + 1}', 'Banking, forex and processing fee – 10% of the speaker honorarium'),
    ('CRE-001', 'Latest actual', None, None, None, 1, 'Webinar creatives: invitation, 3 countdown creatives, agenda and 40-second teaser video'),
    ('WEB-001', 'Recommended', None, None, None, 1, 'Webinar digital streaming: 1.5-hour multi-speaker webinar with dry run and live management'),
    ('CRE-002', 'Latest actual', None, None, None, 3, 'Post-event snippet videos from the webinar recording'),
    ('CRE-003', 'Recommended', None, None, None, 1, 'One-page A4 post-event newsletter'),
]
labels = {s['code']: f"{s['code']} | {s['name']}" for s in seed['services']}
for i, r in enumerate(range(QL0, QL1 + 1)):
    ex = example[i] if i < len(example) else (None,) * 7
    m = f'MATCH($C{r},A_Code,0)'
    fxr = f'INDEX(FX_Rate,MATCH($H{r},FX_Cur,0))'
    put(Q, f'A{r}', i + 1, f_calc, '0')
    put(Q, f'B{r}', labels.get(ex[0]) if ex[0] else None, f_in, fill=fill_input)
    put(Q, f'C{r}', f'=IFERROR(LEFT($B{r},FIND(" | ",$B{r})-1),"")', f_calc)
    put(Q, f'D{r}', f'=IF($C{r}="","",IFERROR(INDEX(C_Unit,MATCH($C{r},C_Code,0)),""))', f_link)
    put(Q, f'E{r}', f'=IF($C{r}="","",IFERROR(INDEX(C_Basis,MATCH($C{r},C_Code,0)),""))', f_link)
    put(Q, f'F{r}', ex[1], f_in, fill=fill_input)
    put(Q, f'G{r}', ex[2], f_in, RATE, fill_input)
    put(Q, f'H{r}', ex[3], f_in, fill=fill_input)
    put(Q, f'I{r}', ex[4], f_in, '#,##0.00', fill_input)
    put(Q, f'J{r}', ex[5], f_calc if isinstance(ex[5], str) else f_in, '#,##0.##', fill_input)
    put(Q, f'K{r}', (f'=IF($C{r}="","",IF($F{r}="Manual",IF(ISNUMBER($G{r}),$G{r},""),'
                     f'IF($F{r}="Foreign currency",IF(AND($H{r}<>"",ISNUMBER($I{r}),ISNUMBER({fxr})),ROUND($I{r}*{fxr},2),""),'
                     f'IFERROR(1*IF($F{r}="Latest actual",INDEX(A_Latest,{m}),IF($F{r}="Median actual",INDEX(A_Median,{m}),IF($F{r}="Recommended",INDEX(A_Rec,{m}),""))),""))))'), f_link, RATE)
    put(Q, f'L{r}', f'=IF(OR($K{r}="",$J{r}=""),0,ROUND($J{r}*$K{r},2))', f_calc, INR)
    pend = f'IFERROR(INDEX(A_Pending,{m}),0)>0'
    put(Q, f'M{r}', (f'=IF($C{r}="","",IF($F{r}="","Choose a rate source",IF($K{r}="",'
                     f'IF($F{r}="Foreign currency",IF($H{r}="","Choose the currency",IF(NOT(ISNUMBER($I{r})),"Enter the foreign amount","Enter the "&$H{r}&" rate for the quote date (top right)")),'
                     f'IF($E{r}="At actuals","Billed at actuals: use Foreign currency or Manual",IF($E{r}="Quoted separately","No price on record: choose Manual",'
                     f'IF(AND($F{r}="Recommended",{pend}),"Recommended blocked: price pending verification","No "&LOWER($F{r})&" rate on record: choose Manual")))),'
                     f'IF({pend},"Check: historical rate is pending verification",IF($F{r}="Manual","Manual rate (not from history)",'
                     f'IF($F{r}="Foreign currency",TEXT($I{r},"#,##0.00")&" "&$H{r}&" × ₹"&TEXT({fxr},"0.00"),IF($E{r}="Percentage","% of the quantity (base amount)","")))))))'), f_calc)
    put(Q, f'N{r}', f'=IF($C{r}="","",IFERROR(IF(INDEX(A_Count,{m})=0,"No actual quotes",TEXT(INDEX(A_Min,{m}),IF($E{r}="Percentage","0%","#,##0.##"))&" – "&TEXT(INDEX(A_Max,{m}),IF($E{r}="Percentage","0%","#,##0.##"))&" ("&INDEX(A_Count,{m})&" quotes)"),""))', f_calc)
    put(Q, f'O{r}', ex[6], f_in, fill=fill_input)
    put(Q, f'P{r}', f'=IF($C{r}="","",COUNTIF($C${QL0}:$C{r},"?*"))', Font(name=F, size=9, color='8A94A6'), '0')
for nm, col in [('Q_LCode', 'C'), ('Q_LUnit', 'D'), ('Q_LBasis', 'E'), ('Q_LQty', 'J'), ('Q_LRate', 'K'), ('Q_LAmt', 'L'), ('Q_LDesc', 'O'), ('Q_LineIdx', 'P')]:
    name(nm, 'quote', f'${col}${QL0}:${col}${QL1}')
dv_list(Q, '=C_Label', f'B{QL0}:B{QL1}', 'Pick a service from the catalogue.')
dv_list(Q, '=L_RateSource', f'F{QL0}:F{QL1}', 'History-based sources use Pricing Analysis. Foreign currency uses the exchange rate you enter for the quote date. Manual uses column G.')
dv_list(Q, '=L_Currency', f'H{QL0}:H{QL1}')
dqn = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True); Q.add_data_validation(dqn)
for col in 'GIJ': dqn.add(f'{col}{QL0}:{col}{QL1}')
Q.conditional_formatting.add(f'M{QL0}:M{QL1}', FormulaRule(formula=[f'LEFT($M{QL0},6)="Manual"'], font=Font(name=F, color='0000FF', italic=True)))
Q.conditional_formatting.add(f'M{QL0}:M{QL1}', FormulaRule(formula=[f'OR(AND($M{QL0}<>"",$K{QL0}=""),LEFT($M{QL0},5)="Check")'], fill=amber))
pct_rule(Q, f'K{QL0}:K{QL1}', f'$E{QL0}="Percentage"'); pct_rule(Q, f'G{QL0}:G{QL1}', f'$E{QL0}="Percentage"')
# summary
S0 = QL1 + 2
put(Q, f'K{S0 - 1}', 'QUOTATION SUMMARY', f_hdr, fill=fill_hdr); put(Q, f'L{S0 - 1}', None, f_hdr, fill=fill_hdr)
summ = [
    ('Professional fees (₹)', f'=SUMIFS($L${QL0}:$L${QL1},$E${QL0}:$E${QL1},"<>At actuals")', 'Q_Prof'),
    ('Pass-through at actuals (₹)', f'=SUMIFS($L${QL0}:$L${QL1},$E${QL0}:$E${QL1},"At actuals")', 'Q_Pass'),
    ('Subtotal (₹)', f'=L{S0}+L{S0 + 1}', 'Q_Sub'),
    ('Discount on professional fees (₹)', f'=ROUND(MIN(L{S0},IF(ISNUMBER(Q_DiscAmt),Q_DiscAmt,L{S0}*N(Q_DiscPct))),2)', 'Q_Disc'),
    ('Discount % (effective)', f'=IF(L{S0}=0,0,L{S0 + 3}/L{S0})', 'Q_DiscEff'),
    ('Taxable value (₹)', f'=L{S0 + 2}-L{S0 + 3}', 'Q_Taxable'),
    ('GST (₹)', f'=ROUND(L{S0 + 5}*Q_GSTRate,2)', 'Q_GST'),
    ('GRAND TOTAL (₹)', f'=L{S0 + 5}+L{S0 + 6}', 'Q_Total'),
    ('Advance on initiation (₹)', f'=IFERROR(IF(INDEX(L_PayAdvance,MATCH(Q_Terms,L_PayTerms,0))="","",ROUND(L{S0 + 7}*INDEX(L_PayAdvance,MATCH(Q_Terms,L_PayTerms,0)),2)),"")', 'Q_Advance'),
    ('Balance (₹)', f'=IF(L{S0 + 8}="","",L{S0 + 7}-L{S0 + 8})', 'Q_Balance'),
    ('Lines without a rate (billed at actuals)', f'=COUNTIFS($C${QL0}:$C${QL1},"?*",$K${QL0}:$K${QL1},"")', 'Q_Unpriced'),
]
for i, (lab, fml, nm) in enumerate(summ):
    r = S0 + i
    big = lab.startswith('GRAND')
    put(Q, f'K{r}', lab, f_bold, align=Alignment(horizontal='right'), fill=fill_kpi if big else None)
    fmt = '0.0%' if '%' in lab else ('0' if lab.startswith('Lines') else INR)
    put(Q, f'L{r}', fml, Font(name=F, size=11 if big else 10, bold=big or i in (2, 5), color=NAVY), fmt, fill_kpi if big else None)
    name(nm, 'quote', f'$L${r}')
put(Q, f'B{S0}', f'=IF(Q_Unpriced>0,Q_Unpriced&" line(s) have no rate yet and count as ₹0. They appear as “At actuals” on the client quotation.","")', Font(name=F, size=10, italic=True, color='9A5B00'))
put(Q, f'B{S0 + 1}', '=IF(AND(N(Q_DiscPct)>0,ISNUMBER(Q_DiscAmt)),"Both a discount % and a discount amount are entered: the amount is used.","")', Font(name=F, size=10, italic=True, color='9A5B00'))
put(Q, f'B{S0 + 2}', f'=IF(AND(ISNUMBER(Q_DiscAmt),Q_DiscAmt>L{S0}),"Discount amount is larger than the professional fees and has been capped.","")', Font(name=F, size=10, italic=True, color='9A5B00'))
put(Q, f'B{S0 + 3}', 'Discount applies to professional fees only (not to pass-through amounts). GST applies to the taxable value, including pass-through, as in the source proposals.', f_sub, align=wrap)
Q.merge_cells(f'B{S0 + 3}:I{S0 + 4}')
put(Q, f'B{S0 + 6}', 'Notes for client', f_bold)
put(Q, f'C{S0 + 6}', 'Speaker honorarium is billed at actuals at the exchange rate on the date of payment, with a 10% processing and co-ordination fee.', f_in, fill=fill_input, align=wrap)
for rr_ in range(S0 + 6, S0 + 9):
    for c in 'CDEFGHI':
        if Q[f'{c}{rr_}'].value is None and not (c == 'C' and rr_ == S0 + 6): put(Q, f'{c}{rr_}', None, f_in, fill=fill_input)
Q.merge_cells(f'C{S0 + 6}:I{S0 + 8}')
name('Q_Notes', 'quote', f'$C${S0 + 6}')
Q.freeze_panes = f'C{QL0}'

# ================================================================ Client Quotation (print-ready)
CQ = ws['client']
CQ.sheet_view.showGridLines = False
for c, w in zip('ABCDEFGH', [2, 5, 50, 7, 18, 14, 19, 2]):
    CQ.column_dimensions[c].width = w
f_cq = Font(name=F, size=10, color='33415C'); f_cqb = Font(name=F, size=10, bold=True, color=NAVY)
try:
    from openpyxl.drawing.image import Image as XLImage
    logo = XLImage(sys.argv[3]); logo.height = 44; logo.width = int(454 * 44 / 120); CQ.add_image(logo, 'B1')
except Exception:
    pass
company = [('Alphamed (OneAlphaMed)', True), ('2414, Ground Floor, Aravali Vihar, Sector 49', False),
           ('Faridabad, Haryana – 121001, India', False), ('+91 9811660635  ·  info@onealphamed.com', False), ('onealphamed.com', False)]
for i, (t, b) in enumerate(company):
    c = CQ.cell(row=1 + i, column=5, value=t); c.font = f_cqb if b else Font(name=F, size=9, color='5B6B86')
    c.alignment = Alignment(horizontal='right'); CQ.merge_cells(start_row=1 + i, start_column=5, end_row=1 + i, end_column=7)
for c in 'BCDEFG':
    CQ[f'{c}7'].fill = PatternFill('solid', fgColor=TEAL)
CQ.row_dimensions[7].height = 4
CQ['B9'] = 'QUOTATION'; CQ['B9'].font = Font(name=F, size=20, bold=True, color=NAVY)
info_r = [('Quote No.', '=Q_Ref', None), ('Date', '=Q_Date', DATE), ('Valid until', '=IF(ISNUMBER(Q_Date),Q_Date+N(Q_Validity),"")', DATE)]
for i, (lab, fml, fmt) in enumerate(info_r):
    r = 9 + i
    c = CQ[f'F{r}']; c.value = lab; c.font = Font(name=F, size=9, color='5B6B86'); c.alignment = Alignment(horizontal='right')
    c = CQ[f'G{r}']; c.value = fml; c.font = f_cqb; c.alignment = Alignment(horizontal='right')
    if fmt: c.number_format = fmt
CQ['B11'] = 'To'; CQ['B11'].font = Font(name=F, size=9, color='5B6B86')
CQ['C11'] = '=Q_Client'; CQ['C11'].font = Font(name=F, size=11, bold=True, color=NAVY)
CQ['C12'] = '=IF(Q_Attn="","","Attention: "&Q_Attn)'; CQ['C12'].font = f_cq
CQ['C13'] = '=IF(Q_Project="","","Project: "&Q_Project)'; CQ['C13'].font = f_cq; CQ['C13'].alignment = Alignment(wrap_text=True, vertical='top')
CQ.merge_cells('C13:E13'); CQ.row_dimensions[13].height = 28
T0 = 15
for col, h in zip('BCDEFG', ['#', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)']):
    c = CQ[f'{col}{T0}']; c.value = h; c.font = f_hdr; c.fill = fill_hdr
    c.alignment = Alignment(horizontal='left' if col == 'C' else 'center', vertical='center')
CQ.row_dimensions[T0].height = 22
NL = QL1 - QL0 + 1
for k in range(1, NL + 1):
    r = T0 + k
    m = f'MATCH($B{r},Q_LineIdx,0)'
    CQ[f'B{r}'] = f'=IF(COUNTIF(Q_LineIdx,{k})=0,"",{k})'
    CQ[f'C{r}'] = f'=IF($B{r}="","",IF(INDEX(Q_LDesc,{m})<>"",INDEX(Q_LDesc,{m}),IFERROR(INDEX(C_Name,MATCH(INDEX(Q_LCode,{m}),C_Code,0)),"")))'
    CQ[f'D{r}'] = f'=IF($B{r}="","",IF(INDEX(Q_LBasis,{m})="Percentage","",INDEX(Q_LQty,{m})))'
    CQ[f'E{r}'] = f'=IF($B{r}="","",IF(INDEX(Q_LBasis,{m})="Percentage",IF(N(INDEX(Q_LQty,{m}))=0,"of amount at actuals","of ₹"&TEXT(INDEX(Q_LQty,{m}),"#,##0")),INDEX(Q_LUnit,{m})))'
    CQ[f'F{r}'] = f'=IF($B{r}="","",IF(INDEX(Q_LRate,{m})="","At actuals",IF(INDEX(Q_LBasis,{m})="Percentage",TEXT(INDEX(Q_LRate,{m}),"0%"),INDEX(Q_LRate,{m}))))'
    CQ[f'G{r}'] = f'=IF($B{r}="","",IF(OR(INDEX(Q_LRate,{m})="",AND(INDEX(Q_LBasis,{m})="Percentage",N(INDEX(Q_LQty,{m}))=0)),"At actuals",INDEX(Q_LAmt,{m})))'
    for col in 'BCDEFG':
        c = CQ[f'{col}{r}']; c.font = Font(name=F, size=9, color='33415C')
        c.alignment = Alignment(horizontal={'B': 'center', 'C': 'left', 'D': 'center', 'E': 'left'}.get(col, 'right'), vertical='top', wrap_text=(col in 'CE'))
    CQ[f'D{r}'].number_format = '#,##0.##'; CQ[f'F{r}'].number_format = RATE; CQ[f'G{r}'].number_format = INR
    CQ.row_dimensions[r].height = 22
TL = T0 + NL
CQ.conditional_formatting.add(f'B{T0 + 1}:G{TL}', FormulaRule(formula=[f'$B{T0 + 1}<>""'], border=Border(bottom=Side(style='thin', color='E3E9F2'))))
CQ.conditional_formatting.add(f'B{T0 + 1}:G{TL}', FormulaRule(formula=[f'AND($B{T0 + 1}<>"",MOD($B{T0 + 1},2)=0)'], fill=PatternFill('solid', fgColor='F5F8FC')))
# summary block
s0 = TL + 2
csum = [('Professional fees', '=Q_Prof', False), ('Pass-through at actuals', '=Q_Pass', False), ('Subtotal', '=Q_Sub', True),
        ('="Less: discount ("&TEXT(Q_DiscEff,"0.0%")&")"', '=Q_Disc', False), ('Taxable value', '=Q_Taxable', True),
        ('="GST @ "&TEXT(Q_GSTRate,"0%")', '=Q_GST', False), ('GRAND TOTAL (₹)', '=Q_Total', True)]
for i, (lab, fml, b) in enumerate(csum):
    r = s0 + i
    c = CQ[f'E{r}']; c.value = lab; c.alignment = Alignment(horizontal='right'); c.font = f_cqb if b else f_cq
    CQ.merge_cells(f'E{r}:F{r}')
    c = CQ[f'G{r}']; c.value = fml; c.number_format = INR; c.alignment = Alignment(horizontal='right'); c.font = f_cqb if b else f_cq
gt = s0 + len(csum) - 1
for col in 'EFG':
    CQ[f'{col}{gt}'].fill = fill_hdr
CQ[f'E{gt}'].font = Font(name=F, size=11, bold=True, color='FFFFFF'); CQ[f'G{gt}'].font = Font(name=F, size=11, bold=True, color='FFFFFF')
CQ[f'E{gt + 1}'] = '="Advance on initiation"'; CQ[f'E{gt + 1}'].alignment = Alignment(horizontal='right'); CQ[f'E{gt + 1}'].font = Font(name=F, size=9, color='5B6B86')
CQ.merge_cells(f'E{gt + 1}:F{gt + 1}')
CQ[f'G{gt + 1}'] = '=Q_Advance'; CQ[f'G{gt + 1}'].number_format = INR; CQ[f'G{gt + 1}'].alignment = Alignment(horizontal='right'); CQ[f'G{gt + 1}'].font = Font(name=F, size=9, color='5B6B86')
CQ.conditional_formatting.add(f'E{s0 + 3}:G{s0 + 3}', FormulaRule(formula=['Q_Disc=0'], font=Font(name=F, color='B0B8C6')))
CQ[f'B{s0}'] = '=IF(Q_Unpriced>0,"Lines marked “At actuals” are billed at actual cost (plus any stated fee) and are not included in the totals.","")'
CQ[f'B{s0}'].font = Font(name=F, size=9, italic=True, color='5B6B86'); CQ[f'B{s0}'].alignment = wrap
CQ.merge_cells(f'B{s0}:C{s0 + 2}')
CQ[f'B{s0 + 4}'] = 'All amounts in Indian Rupees (INR).'; CQ[f'B{s0 + 4}'].font = Font(name=F, size=9, color='5B6B86')
# terms
t0 = gt + 3
from openpyxl.worksheet.pagebreak import Break
CQ.row_breaks.append(Break(id=t0 - 1))
blocks = [('Payment terms', '=Q_Terms'), ('Notes', '=IF(Q_Notes="","—",Q_Notes)')]
r = t0
for lab, fml in blocks:
    CQ[f'B{r}'] = lab; CQ[f'B{r}'].font = f_cqb
    CQ[f'B{r + 1}'] = fml; CQ[f'B{r + 1}'].font = f_cq; CQ[f'B{r + 1}'].alignment = wrap
    CQ.merge_cells(f'B{r + 1}:G{r + 1}'); CQ.row_dimensions[r + 1].height = 30
    r += 3
CQ[f'B{r}'] = 'Terms & conditions'; CQ[f'B{r}'].font = f_cqb
tc = [
    '="GST @ "&TEXT(Q_GSTRate,"0%")&" is applicable as per Government of India norms. TDS will be deducted as applicable."',
    '1. Speaker and KOL honoraria, where applicable, are billed at actuals with a 10% processing and co-ordination fee.',
    '2. All creative content is submitted for MLR / compliance review. Two revision rounds are included per asset; client review is assumed at 5 business days.',
    '3. Cancellation: before execution, 50% of the total value is payable; after partial execution, proportionate cost plus 25% of the remaining value; after all deliverables are submitted, 100%.',
    '4. Late payments attract interest at 1.5% per month on the outstanding amount.',
    '5. The client retains ownership of all final content; OneAlphaMed retains rights to its proprietary platforms, AlphaMedX and doctor database.',
    '="6. This quotation is valid for "&N(Q_Validity)&" days from the date of issue. Disputes: mediation first, then arbitration under Indian law; jurisdiction Mumbai."',
]
for i, t in enumerate(tc):
    rr_ = r + 1 + i
    CQ[f'B{rr_}'] = t; CQ[f'B{rr_}'].font = Font(name=F, size=9, color='33415C'); CQ[f'B{rr_}'].alignment = wrap
    CQ.merge_cells(f'B{rr_}:G{rr_}'); CQ.row_dimensions[rr_].height = 26 if len(t) > 150 else 16
sg = r + len(tc) + 3
CQ[f'B{sg}'] = 'For Alphamed (OneAlphaMed)'; CQ[f'B{sg}'].font = f_cqb
CQ[f'E{sg}'] = '="For "&Q_Client'; CQ[f'E{sg}'].font = f_cqb
for i, lab in enumerate(['Signature', 'Name', 'Designation', 'Date']):
    rr_ = sg + 2 + i
    for col in ('B', 'E'):
        CQ[f'{col}{rr_}'] = f'{lab}:'; CQ[f'{col}{rr_}'].font = Font(name=F, size=9, color='5B6B86')
    for col in ('C', 'F', 'G'):
        CQ[f'{col}{rr_}'].border = Border(bottom=Side(style='thin', color='B0B8C6'))
    CQ.row_dimensions[rr_].height = 20
ft = sg + 7
CQ[f'B{ft}'] = 'MUMBAI  •  GURGAON  •  JAKARTA'; CQ[f'B{ft}'].font = Font(name=F, size=9, bold=True, color=TEAL)
CQ[f'B{ft}'].alignment = Alignment(horizontal='center'); CQ.merge_cells(f'B{ft}:G{ft}')
CQ[f'B{ft + 1}'] = 'Confidential  |  onealphamed.com'; CQ[f'B{ft + 1}'].font = Font(name=F, size=8, color='8A94A6')
CQ[f'B{ft + 1}'].alignment = Alignment(horizontal='center'); CQ.merge_cells(f'B{ft + 1}:G{ft + 1}')
CQ.print_area = f'A1:H{ft + 1}'
CQ.page_setup.paperSize = CQ.PAPERSIZE_A4
CQ.page_margins.left = CQ.page_margins.right = 0.4; CQ.page_margins.top = 0.4; CQ.page_margins.bottom = 0.5
CQ.oddFooter.center.text = 'Page &P of &N'; CQ.oddFooter.center.size = 8
CQ.sheet_properties.tabColor = '3DBE5A'
CQ_PORTRAIT = True

# ================================================================ Dashboard
B = ws['dash']
title(B, 'OneAlphaMed Pricing Dashboard', 'Key pricing insights. Everything on this sheet is a formula over the Master Pricing Database, Catalogue, Source Documents and Pricing Analysis.')
for c, w in zip('ABCDEFGHIJKLMN', [34, 16, 3, 34, 16, 3, 30, 12, 16, 16, 16, 13, 13, 3]):
    B.column_dimensions[c].width = w
kpis = [
    ('Services & products in catalogue', '=COUNTIFS(C_Code,"?*",C_Status,"Active")', '0'),
    ('Services with actual rates', '=COUNTIF(A_Count,">0")', '0'),
    ('Services with no actual rate', '=COUNTIFS(A_Code,"?*",A_Count,0)', '0'),
    ('Source documents', '=COUNTIF(SD_ID,"?*")', '0'),
    ('Clients', '=COUNTIF(L_Clients,"?*")', '0'),
    ('Current rate records', '=COUNTIFS(M_Code,"?*",M_Status,"Current")', '0'),
    ('Superseded rate records (kept as history)', '=COUNTIFS(M_Code,"?*",M_Status,"Superseded")', '0'),
    ('Quoted value – actual, current (₹)', '=SUMIFS(M_Sell,M_Type,"Actual",M_Status,"Current",M_Optional,"No")', INR),
    ('Pass-through value – current (₹)', '=SUMIFS(M_Sell,M_Type,"Pass-through",M_Status,"Current")', INR),
    ('Earliest document', '=MIN(SD_Date)', DATE),
    ('Latest document', '=MAX(SD_Date)', DATE),
    ('Records with internal cost entered', '=COUNTIFS(M_Code,"?*",M_UnitCost,">=0")', '0'),
]
put(B, 'A4', 'KEY FIGURES', f_hdr, fill=fill_hdr); put(B, 'B4', '', f_hdr, fill=fill_hdr)
for i, (lab, fml, fmt) in enumerate(kpis):
    r = 5 + i
    put(B, f'A{r}', lab, f_body, fill=fill_kpi); put(B, f'B{r}', fml, Font(name=F, size=11, bold=True, color=NAVY), fmt, fill_kpi)
dq = [
    ('Services flagged “Inconsistent – review”', '=COUNTIF(A_Consist,"Inconsistent*")'),
    ('Rate lines differing from service average', '=COUNTIF(M_Consist,"Differs*")'),
    ('Duplicate entries / record IDs', '=COUNTIF(M_Dup,"Duplicate*")'),
    ('Duplicate catalogue codes or names', f"=COUNTIF({q('cat')}!$K$5:$K${MAXC},\"Duplicate*\")"),
    ('Line amount ≠ document amount', '=COUNTIF(M_AmtCheck,"Mismatch*")'),
    ('Document total ≠ sum of lines', '=COUNTIF(SD_Check,"Mismatch*")'),
    ('Lines with inconsistent FX rate', '=COUNTIF(M_FXFlag,"FX*")'),
    ('Actual rates without a source document', '=COUNTIFS(M_Code,"?*",M_Type,"Actual",M_Doc,"")'),
    ('Services quoted separately (no price)', '=COUNTIF(C_Basis,"Quoted separately")'),
    ('Rate lines pending verification', '=COUNTIFS(M_Verify,"Pending verification",M_Status,"Current")'),
]
put(B, 'D4', 'DATA QUALITY FLAGS', f_hdr, fill=fill_hdr); put(B, 'E4', 'Count', f_hdr, fill=fill_hdr, align=center)
for i, (lab, fml) in enumerate(dq):
    r = 5 + i
    put(B, f'D{r}', lab, f_body, fill=fill_kpi); put(B, f'E{r}', fml, Font(name=F, size=11, bold=True, color=NAVY), '0', fill_kpi)
B.conditional_formatting.add('E5:E14', CellIsRule(operator='greaterThan', formula=['0'], fill=amber))
B.conditional_formatting.add('E5:E14', CellIsRule(operator='equal', formula=['0'], fill=green))
# insights
put(B, 'G4', 'INSIGHTS', f_hdr, fill=fill_hdr)
for c in 'HIJ': put(B, f'{c}4', '', f_hdr, fill=fill_hdr)
ins = [
    ('Largest single proposal', '=INDEX(SD_Project,MATCH(MAX(SD_Subtotal),SD_Subtotal,0))&" – "&INDEX(SD_Client,MATCH(MAX(SD_Subtotal),SD_Subtotal,0))&" (₹"&TEXT(MAX(SD_Subtotal)/100000,"0.00")&" lakh)"'),
    ('Most-quoted service', '=INDEX(A_Service,MATCH(MAX(A_Count),A_Count,0))&" ("&MAX(A_Count)&" quotes)"'),
    ('Highest-value service line', '=INDEX(A_Service,MATCH(MAX(A_Value),A_Value,0))&" (₹"&TEXT(MAX(A_Value)/100000,"0.00")&" lakh)"'),
    ('Services with High-confidence recommendation', f"=COUNTIF('{SHEET['anal']}'!$P${AR0}:$P${AR1},\"High\")&\" of \"&COUNTIF(A_Count,\">0\")&\" priced services\""),
    ('Margin analysis', '=IF(COUNTIFS(M_Code,"?*",M_UnitCost,">=0")=0,"No internal costs in source documents – enter costs in Master column Q to see margins","Average margin "&TEXT(AVERAGEIFS(M_MarginPct,M_Type,"Actual",M_Status,"Current",M_MarginPct,">-1000"),"0%"))'),
]
for i, (lab, fml) in enumerate(ins):
    r = 5 + i
    put(B, f'G{r}', lab, f_bold, fill=fill_kpi, align=wrap)
    put(B, f'H{r}', fml, f_body, fill=fill_kpi, align=wrap); B.merge_cells(f'H{r}:L{r}')
    B.row_dimensions[r].height = 30
# client summary
cs0 = 19
put(B, f'A{cs0 - 1}', 'CLIENT-WISE PRICING', f_bold)
for j, h in enumerate(['Client', 'Documents', '', 'Actual Lines', 'Quoted Value (₹)']):
    put(B, f'{CL(j + 1)}{cs0}', h, f_hdr, fill=fill_hdr, align=center)
for i in range(12):
    r = cs0 + 1 + i
    put(B, f'A{r}', f'=IF(INDEX(L_Clients,{i + 1})="","",INDEX(L_Clients,{i + 1}))', f_link)
    put(B, f'B{r}', f'=IF($A{r}="","",COUNTIF(SD_Client,$A{r}))', f_calc, '0')
    put(B, f'D{r}', f'=IF($A{r}="","",COUNTIFS(M_Client,$A{r},M_Type,"Actual",M_Status,"Current"))', f_calc, '0')
    put(B, f'E{r}', f'=IF($A{r}="","",SUMIFS(M_Sell,M_Client,$A{r},M_Type,"Actual",M_Status,"Current",M_Optional,"No"))', f_calc, INR)
# category summary
put(B, f'G{cs0 - 1}', 'CATEGORY-WISE PRICING', f_bold)
for j, h in enumerate(['Category', 'Services', 'Priced Services', 'Actual Lines', 'Quoted Value (₹)']):
    put(B, f'{CL(7 + j)}{cs0}', h, f_hdr, fill=fill_hdr, align=center)
for i in range(12):
    r = cs0 + 1 + i
    put(B, f'G{r}', f'=IF(INDEX(L_Categories,{i + 1})="","",INDEX(L_Categories,{i + 1}))', f_link)
    put(B, f'H{r}', f'=IF($G{r}="","",COUNTIF(C_Category,$G{r}))', f_calc, '0')
    put(B, f'I{r}', f"=IF($G{r}=\"\",\"\",COUNTIFS(C_Category,$G{r},{q('cat')}!$I$5:$I${MAXC},\">0\"))", f_calc, '0')
    put(B, f'J{r}', f'=IF($G{r}="","",COUNTIFS(M_Category,$G{r},M_Type,"Actual",M_Status,"Current"))', f_calc, '0')
    put(B, f'K{r}', f'=IF($G{r}="","",SUMIFS(M_Sell,M_Category,$G{r},M_Type,"Actual",M_Status,"Current",M_Optional,"No"))', f_calc, INR)
# charts
ch1 = BarChart(); ch1.type = 'bar'; ch1.style = 10; ch1.title = 'Quoted value by client (₹, actual, current)'
ch1.add_data(Reference(B, min_col=5, min_row=cs0, max_row=cs0 + len(clients)), titles_from_data=True)
ch1.set_categories(Reference(B, min_col=1, min_row=cs0 + 1, max_row=cs0 + len(clients)))
ch1.legend = None; ch1.height = 7.5; ch1.width = 16; ch1.y_axis.numFmt = '#,##0,"k"'; ch1.y_axis.title = '₹ thousand'
B.add_chart(ch1, f'A{cs0 + 14}')
ch2 = BarChart(); ch2.type = 'bar'; ch2.style = 12; ch2.title = 'Quoted value by category (₹, actual, current)'
ch2.add_data(Reference(B, min_col=11, min_row=cs0, max_row=cs0 + len(seed['categories'])), titles_from_data=True)
ch2.set_categories(Reference(B, min_col=7, min_row=cs0 + 1, max_row=cs0 + len(seed['categories'])))
ch2.legend = None; ch2.height = 7.5; ch2.width = 18; ch2.y_axis.numFmt = '#,##0,"k"'; ch2.y_axis.title = '₹ thousand'
B.add_chart(ch2, f'G{cs0 + 14}')
# review notes
rn0 = cs0 + 31
put(B, f'A{rn0}', 'POINTS TO REVIEW (from reading the source documents)', f_bold)
DECIDED = {
    'VID-002': 'PENDING VERIFICATION (10 Nov 2026): infographic-to-animation package ₹25,000 for all 30 videos (≈ ₹833 per video) vs ₹3,00,000 for a single 1-minute animated video. Kept as quoted, flagged in the Master, and blocked from recommendations until OneAlphaMed confirms.',
    'CIPLA-ISP-2026-08|Supersedes': 'DECIDED (10 Nov 2026): D01 (Cipla ISP, Jun 2026) stays Superseded and in history; D02 (Aug 2026) is the current reference.',
}
def note_text(n):
    if n['ref'] == 'VID-002': return DECIDED['VID-002']
    if n['ref'] == 'CIPLA-ISP-2026-08' and n['message'].startswith('Supersedes'): return DECIDED['CIPLA-ISP-2026-08|Supersedes']
    if n['message'].startswith('No internal cost'): return 'DECIDED (10 Nov 2026): internal cost and margin fields stay blank until actual internal costs are provided. No costs are assumed.'
    return n['message']
notes = [note_text(n) for n in seed['review_notes']] + [
    'DECIDED (10 Nov 2026): new quotations use the actual exchange rate on the quote date, entered on the Quotation Calculator. Historical rates stay as quoted: €1 = ₹113 (D01), US$1 = ₹98 (D02), US$1 = ₹96 (D05, D06).',
    'Two webinar streaming tiers exist: ₹50,000 for a 60-minute single-expert webinar (WEB-002) and ₹75,000 for a 1.5-hour multi-speaker webinar (WEB-001). They are separate services, not duplicates.',
]
for i, n in enumerate(notes):
    r = rn0 + 1 + i
    put(B, f'A{r}', f'{i + 1}. {n}', f_body, align=wrap); B.merge_cells(f'A{r}:L{r}'); B.row_dimensions[r].height = 28

PENDING_IDS = ', '.join(f'PR-{i + 1:04d}' for i, rr in enumerate(rows) if rr['verify'] == 'Pending verification')
# ================================================================ Update Log
U = ws['log']
title(U, 'Update Log', 'Record every addition, correction or status change here. One row per change. Never delete rows.')
uh = ['Log ID', 'Date', 'Changed By', 'Sheet', 'Record ID / Code', 'Change Type', 'Description', 'Previous Value', 'New Value', 'Source Document', 'Approved By']
header(U, 4, uh, [8, 12, 22, 26, 18, 15, 70, 18, 18, 14, 16], inputs=tuple(range(1, 12)))
log = [
    ('LOG-0001', 'All sheets', '—', 'Initial load', f'Workbook created from all {len(docs)} documents in Google Drive › Proposals (no subfolders): {len(rows)} price lines, {len(seed["services"])} services in {len(seed["categories"])} categories, {len(clients)} clients. Prices copied exactly; nothing estimated.', None, None, 'D01–D11'),
    ('LOG-0002', SHEET['master'], 'PR-0001 to PR-0007', 'Status change', 'D01 lines set to Superseded: D02 (14 Aug 2026) is the updated version of the same Cipla International Speaker Program proposal. History kept.', 'Current', 'Superseded', 'D01'),
    ('LOG-0003', SHEET['cat'], 'VID-003, DOC-002', 'New service', 'Added with no price. The proposals list these as “quoted separately”, so no rate was entered.', None, None, 'D04, D09'),
    ('LOG-0004', SHEET['master'], 'SPK-003 lines', 'Note', 'Banking/forex fee stored as Quantity = honorarium base (₹) and Unit Rate = 10%, so Selling Price = Quantity × Rate matches the document amount.', None, None, 'D01, D02, D05, D06'),
    ('LOG-0005', SHEET['master'], 'Column Q', 'Note', 'No internal cost data in any source document; cost and margin columns left blank until real costs are entered.', None, None, None),
    ('LOG-0006', SHEET['master'], 'PR-0001 to PR-0007', 'Status change', 'Confirmed by OneAlphaMed: D01 (Cipla ISP, Jun 2026) stays Superseded and in history; D02 (Aug 2026) is the current reference.', 'Superseded', 'Superseded (confirmed)', 'D01, D02'),
    ('LOG-0007', SHEET['master'], PENDING_IDS, 'Verification', 'Infographic-to-animation package (₹25,000 for 30 videos) set to Pending verification on OneAlphaMed instruction. Price kept as quoted; recommended rate blocked until verified.', 'As per document', 'Pending verification', 'D07'),
    ('LOG-0008', SHEET['quote'], 'Exchange rates', 'Setting change', 'FX policy: new quotations use the actual exchange rate on the quote date (entered in the Quotation Calculator). Historical ₹96 and ₹98 per US$ kept as originally quoted.', None, None, None),
    ('LOG-0009', SHEET['master'], 'Columns Q–T', 'Note', 'Confirmed: internal cost and margin fields stay blank until actual internal costs are provided. No assumptions.', None, None, None),
    ('LOG-0010', SHEET['quote'] + ', ' + SHEET['client'], '—', 'New service', 'Quotation Calculator v2: discount % and amount, payment-terms dropdown, GST, quotation summary, foreign-currency lines; new print-ready Client Quotation sheet for PDF / Excel export.', None, None, None),
]
for i, (lid, sheet, rec, ctype, desc, prev, new, srcdoc) in enumerate(log):
    by = 'Claude (for OneAlphaMed BD)' if i < 5 else 'Claude, on OneAlphaMed BD instruction'
    r = 5 + i
    for j, v in enumerate([lid, dt.date(2026, 11, 10), by, sheet, rec, ctype, desc, prev, new, srcdoc, None], start=1):
        put(U, f'{CL(j)}{r}', v, f_in, DATE if j == 2 else None, align=wrap if j == 7 else None)
for r in range(5 + len(log), 300):
    for j in range(1, 12):
        put(U, f'{CL(j)}{r}', None, f_in, DATE if j == 2 else None)
dv_list(U, '=L_ChangeType', 'F5:F299')
U.conditional_formatting.add('A5:A299', FormulaRule(formula=['AND($A5<>"",COUNTIF($A$5:$A$299,$A5)>1)'], fill=red))
U.freeze_panes = 'A5'; U.auto_filter.ref = 'A4:K299'

# ================================================================ Read Me
R = ws['readme']
title(R, 'OneAlphaMed Pricing Master', 'Consolidated product- and service-wise pricing from OneAlphaMed client proposals. Version 2 · 10 Nov 2026.')
R.column_dimensions['A'].width = 30; R.column_dimensions['B'].width = 110
try:
    from openpyxl.drawing.image import Image as XLImage
    img = XLImage(sys.argv[3]); img.height = 46; img.width = int(454 * 46 / 120); R.add_image(img, 'D1')
except Exception:
    pass
sections = [
    ('SOURCE', None),
    ('Data source', 'Google Drive › Proposals folder (11 files: 7 PDF, 4 Word; no subfolders, no Excel or PowerPoint files). Every file was read in full.'),
    ('What was extracted', 'Every priced line in each document’s commercials section: service, scope, quantity, unit rate, amount, currency and exchange rate, with the exact wording kept in “Source Excerpt”.'),
    ('What was NOT invented', 'No missing price was filled in. Add-ons “quoted separately” have no price. No internal costs exist in the documents, so cost and margin stay blank until you enter real costs.'),
    ('Original files', 'Originals stay in Google Drive. Source Documents has an “Open in Drive” link and the Drive file ID for each one.'),
    ('SHEETS', None),
    ('Dashboard', 'Key figures, data-quality flags, insights, client- and category-wise value, charts and points to review.'),
    (SHEET['master'], 'One row per price line. Service, category, client, project, scope, quantity, unit rate, selling price, cost, margin, rate type, status and checks.'),
    (SHEET['cat'], 'Standardised list of all offerings with codes, units, pricing basis and the names used in documents.'),
    (SHEET['hist'], 'Filter past rates by service, client and status, with dates, change vs average and Drive links.'),
    (SHEET['quote'], 'Internal working sheet: pick services and a rate source, enter quantities, discount, payment terms and exchange rates; GST, totals and advance calculate.'),
    (SHEET['client'], 'Print-ready A4 quotation for the client (up to 20 lines). Page 1: lines and totals; page 2: terms and signatures. No internal rate sources or history are shown.'),
    (SHEET['anal'], 'Min, max, average, median, latest and recommended rate per service; pass-through, estimated and margin columns; client comparison matrix.'),
    (SHEET['log'], 'Record every change.'),
    (SHEET['docs'], 'Project register: one row per document with stated totals, a check against the sum of its lines, terms and Drive link.'),
    (SHEET['lists'], 'Dropdown lists and settings (tolerances, GST).'),
    ('PRICE TYPES', None),
    ('Actual', 'Client-facing price quoted in a source document. Must have a Doc ID.'),
    ('Pass-through', 'Billed at actuals (speaker honoraria). Shown separately; never used for recommendations.'),
    ('Estimated', 'Internal estimate not yet quoted. Enter in the Master with Rate Type = Estimated (Doc ID optional).'),
    ('Recommended', 'Calculated on Pricing Analysis from actual current rates only. Never typed in and never stored as a record.'),
    ('HOW TO ADD A NEW PROJECT', None),
    ('1. Register the document', 'Source Documents: add a row with the next Doc ID (D12, …), file name, client, project, date, stated totals and Drive file ID.'),
    ('2. New service?', 'Catalogue: add a row with the next code in its category (e.g. WEB-005). The Duplicate Check column flags repeated codes or names.'),
    ('3. Add the price lines', 'Master Pricing Database: fill the next blank row (blue columns). Formulas are already in place to row 600.'),
    ('4. Correcting a price', 'Never overwrite. Set the old row’s Record Status to Superseded, note why, and add a corrected row.'),
    ('5. Log it', 'Update Log: one row per change.'),
    ('6. Check the flags', 'Dashboard › Data Quality should show 0 for duplicates and mismatches. Amber cells mark lines to review.'),
    ('PRICING POLICIES (10 Nov 2026)', None),
    ('Cipla June proposal', 'D01 stays Superseded and in history. D02 (Aug 2026) is the current reference.'),
    ('Pending verification', 'Infographic-to-animation ₹25,000 (30 videos) is kept as quoted but flagged. It is not used for recommended rates until OneAlphaMed confirms it; then set Verification Status to “Verified by OneAlphaMed” and log it.'),
    ('Exchange rates', 'New quotations use the actual rate on the quote date (Quotation Calculator, top right). Historical ₹96 / ₹98 per US$ and ₹113 per € stay as originally quoted.'),
    ('Internal costs', 'Cost and margin fields stay blank until actual internal costs are provided. Nothing is assumed.'),
    ('MAKING A QUOTATION', None),
    ('1. Start', 'Quotation Calculator: overwrite the yellow header cells (client, project, date, reference, validity, payment terms, GST, discount).'),
    ('2. Lines', 'Pick a service, then a rate source: Latest actual, Median actual, Recommended, Foreign currency (amount × the rate you enter for the quote date) or Manual. Clear unused example lines.'),
    ('3. Check', 'Read the Rate Note column: amber notes need action. Discount applies to professional fees only; GST applies to the taxable value.'),
    ('4. Export to PDF', 'Open Client Quotation › File › Save As / Export › PDF, choosing “Active sheet” (the print area is A4 portrait, already set).'),
    ('5. Export to Excel', 'Right-click the Client Quotation tab › Move or Copy › (new book) › Create a copy. In the copy, select all › Copy › Paste Special › Values so the numbers stay fixed.'),
    ('6. Record it', 'Log the quotation in the Update Log (type “Quotation issued”). When the client accepts, register it in Source Documents and add its lines to the Master as Actual rates.'),
    ('COLOUR KEY', None),
    ('Blue text', 'Hardcoded input typed from a document; edit these.'),
    ('Black text', 'Formula; do not overwrite.'),
    ('Green text', 'Formula pulling from another sheet.'),
    ('Yellow fill', 'Input cell on the Quotation Calculator and Settings.'),
    ('Blue header', 'Input column. Navy header = calculated column.'),
    ('Amber / red fill', 'Flag to review (inconsistent rate, duplicate, mismatch).'),
    ('Grey italic row', 'Superseded record, kept for history.'),
    ('Amber Verification cell', 'Price pending verification: kept as quoted, not used for recommendations.'),
]
r = 4
for lab, text in sections:
    if text is None:
        r += 1
        put(R, f'A{r}', lab, f_hdr, fill=fill_hdr); put(R, f'B{r}', '', f_hdr, fill=fill_hdr)
    else:
        put(R, f'A{r}', lab, f_bold, align=wrap); put(R, f'B{r}', text, f_body, align=wrap)
        R.row_dimensions[r].height = 30 if len(text) > 110 else 16
    r += 1
for s in (R, B):
    s.sheet_properties.tabColor = TEAL
for s in (M, C, D):
    s.sheet_properties.tabColor = BLUE
Q.sheet_properties.tabColor = '3DBE5A'

# print setup
for s in wb.worksheets:
    s.page_setup.orientation = 'portrait' if s.title == SHEET['client'] else 'landscape'; s.page_setup.fitToWidth = 1; s.page_setup.fitToHeight = 0
    s.sheet_properties.pageSetUpPr.fitToPage = True
wb.calculation.fullCalcOnLoad = True
wb.active = 0
wb.save(OUT)
print('saved', OUT, 'rows', len(rows), 'docs', len(docs), 'services', len(seed['services']))
