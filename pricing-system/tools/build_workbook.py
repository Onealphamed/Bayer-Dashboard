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
    'hist': 'Historical Pricing', 'quote': 'Quotation Calculator', 'anal': 'Pricing Analysis',
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
                 pct=False)
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
    'F': ('Rate Source (quote)', ['Latest actual', 'Median actual', 'Recommended', 'Manual'], 'L_RateSource'),
    'G': ('Document Status', ['Proposal', 'Accepted', 'Rejected', 'Superseded', 'Invoice', 'Rate card'], 'L_DocStatus'),
    'H': ('Change Type', ['Initial load', 'New record', 'Correction', 'Status change', 'New service', 'New document', 'Setting change', 'Note'], 'L_ChangeType'),
    'I': ('Clients', clients, 'L_Clients'),
    'J': ('Status Filter', ['All', 'Current', 'Superseded'], 'L_HistStatus'),
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
      'Duplicate Check', 'Consistency Check', 'FX Check', 'Entered By', 'Entered On', 'History Key (helper)']
INPUT_COLS = (1, 2, 3, 6, 9, 12, 13, 15, 17, 21, 22, 23, 24, 25, 26, 28, 32, 33)
header(M, 4, mh, [10, 7, 12, 18, 30, 9, 34, 22, 48, 11, 16, 11, 12, 14, 14, 16, 12, 12, 12, 9, 12, 11, 34, 9, 9, 11, 10, 56, 16, 26, 26, 14, 12, 8],
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
    put(M, f'AH{r}', f'=IF(AND($F{r}<>"",OR(HP_Code="",$F{r}=HP_Code),OR(HP_Client="All clients",$D{r}=HP_Client),OR(HP_Status="All",$V{r}=HP_Status)),MAX($AH$4:$AH{r - 1})+1,"")', Font(name=F, size=9, color='8A94A6'))
for nm, col in [('M_RecID', 'A'), ('M_Doc', 'B'), ('M_Date', 'C'), ('M_Client', 'D'), ('M_Project', 'E'), ('M_Code', 'F'), ('M_Service', 'G'),
                ('M_Category', 'H'), ('M_Scope', 'I'), ('M_Basis', 'J'), ('M_Unit', 'K'), ('M_Qty', 'L'), ('M_Rate', 'M'), ('M_Sell', 'N'),
                ('M_Quoted', 'O'), ('M_AmtCheck', 'P'), ('M_UnitCost', 'Q'), ('M_TotCost', 'R'), ('M_Margin', 'S'), ('M_MarginPct', 'T'),
                ('M_Type', 'U'), ('M_Status', 'V'), ('M_Note', 'W'), ('M_Optional', 'X'), ('M_Curr', 'Y'), ('M_OrigAmt', 'Z'), ('M_FX', 'AA'),
                ('M_Excerpt', 'AB'), ('M_Dup', 'AC'), ('M_Consist', 'AD'), ('M_FXFlag', 'AE'), ('M_HistKey', 'AH')]:
    name(nm, 'master', f'${col}$5:${col}${MAXM}')
dv_list(M, '=SD_ID', f'B5:B{MAXM}', 'Doc ID from the Source Documents sheet. Leave blank only for Estimated rates.')
dv_list(M, '=C_Code', f'F5:F{MAXM}', 'Service code from the catalogue.')
dv_list(M, '=L_RateType', f'U5:U{MAXM}')
dv_list(M, '=L_RecStatus', f'V5:V{MAXM}')
dv_list(M, '=L_YesNo', f'X5:X{MAXM}')
dnum = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True)
dnum.error = 'Enter a number ≥ 0 (no text, no ₹ sign).'; M.add_data_validation(dnum)
for col in 'LMOQZ': dnum.add(f'{col}5:{col}{MAXM}')
ddate = DataValidation(type='date', operator='greaterThan', formula1='36526', allow_blank=True)
ddate.error = 'Enter a date (e.g. 10-Nov-2026).'; M.add_data_validation(ddate); ddate.add(f'C5:C{MAXM}')
M.conditional_formatting.add(f'A5:AH{MAXM}', FormulaRule(formula=['$V5="Superseded"'], font=Font(name=F, color='8A94A6', italic=True)))
pct_rule(M, f'M5:M{MAXM}', '$J5="Percentage"')
M.conditional_formatting.add(f'P5:P{MAXM}', FormulaRule(formula=['LEFT($P5,8)="Mismatch"'], fill=red))
M.conditional_formatting.add(f'AC5:AE{MAXM}', FormulaRule(formula=['AC5<>""'], fill=amber))
M.conditional_formatting.add(f'U5:U{MAXM}', FormulaRule(formula=['$U5="Pass-through"'], fill=lblue))
M.conditional_formatting.add(f'U5:U{MAXM}', FormulaRule(formula=['$U5="Estimated"'], fill=lviolet))
M.conditional_formatting.add(f'B5:B{MAXM}', FormulaRule(formula=['AND($F5<>"",$U5="Actual",$B5="")'], fill=red))
M.conditional_formatting.add(f'D5:K{MAXM}', FormulaRule(formula=['OR(D5="Doc ID not found",D5="Code not in catalogue")'], fill=red))
M.freeze_panes = 'G5'; M.auto_filter.ref = f'A4:AH{MAXM}'
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
      'Rate Type', 'Status', 'vs Service Average', 'Source Document', 'Source Excerpt', 'Drive Link']
header(H, 6, hh, [5, 10, 12, 18, 30, 9, 36, 16, 11, 12, 14, 12, 11, 11, 40, 56, 13])
H.column_dimensions['P'].width = 56
src = {'B': 'M_RecID', 'C': 'M_Date', 'D': 'M_Client', 'E': 'M_Project', 'F': 'M_Code', 'G': 'M_Service', 'H': 'M_Unit',
       'I': 'M_Qty', 'J': 'M_Rate', 'K': 'M_Sell', 'L': 'M_Type', 'M': 'M_Status', 'P': 'M_Excerpt'}
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
H.freeze_panes = 'C7'; H.auto_filter.ref = f'A6:Q{MAXM + 2}'

# ================================================================ Pricing Analysis
A = ws['anal']
title(A, 'Pricing Analysis', 'Minimum, maximum, average and median of ACTUAL current rates per service, with a formula-based recommended rate and margin analysis. Pass-through and estimated rates are shown separately.')
ah = ['Code', 'Service', 'Unit', 'Pricing Basis', 'Actual Quotes (#)', 'Min Rate (₹)', 'Max Rate (₹)', 'Average Rate (₹)', 'Median Rate (₹)',
      'Latest Quote Date', 'Latest Rate (₹)', 'Spread (Max ÷ Min − 1)', 'Consistency', 'RECOMMENDED Rate (₹)', 'Recommendation Method',
      'Confidence', 'Pass-through Min (₹)', 'Pass-through Max (₹)', 'Estimated Rates (#)', 'Estimated Average (₹)',
      'Avg Unit Internal Cost (₹)', 'Avg Margin %', 'Min Margin %', 'Quoted Value, Actual (₹)']
header(A, 5, ah, [9, 40, 18, 13, 9, 12, 12, 12, 12, 12, 12, 11, 20, 15, 22, 11, 14, 14, 10, 13, 14, 12, 12, 15])
A['A3'] = ('Recommended rate rule: no actual data → no recommendation · spread ≤ Consistency threshold (Lists) → latest actual rate · otherwise → median. '
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
    put(A, f'N{r}', f'=IF($A{r}="","",IF($D{r}="Quoted separately","No price on record",IF($D{r}="At actuals","At actuals",IF($E{r}=0,"No data",IF(N($L{r})<=Tol_Consistent,$K{r},$I{r})))))', Font(name=F, size=10, bold=True, color=NAVY), RATE)
    put(A, f'O{r}', f'=IF(NOT(ISNUMBER($N{r})),"",IF($E{r}=1,"Single quote",IF(N($L{r})<=Tol_Consistent,"Latest (rates consistent)","Median (rates vary)")))', f_calc)
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
for nm, col in [('A_Code', 'A'), ('A_Service', 'B'), ('A_Count', 'E'), ('A_Min', 'F'), ('A_Max', 'G'), ('A_Median', 'I'), ('A_Latest', 'K'),
                ('A_Consist', 'M'), ('A_Rec', 'N'), ('A_Value', 'X')]:
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
A.freeze_panes = 'C6'; A.auto_filter.ref = f'A5:X{AR1}'

# ================================================================ Quotation Calculator
Q = ws['quote']
title(Q, 'Quotation Calculator', 'Yellow cells are inputs. Pick a service and a rate source; the rate comes from Pricing Analysis. The example below rebuilds the Oct 2026 International Speaker Programme quote — overwrite it for a new client.')
for c, w in zip('ABCDEFGHIJKL', [5, 52, 10, 18, 14, 16, 14, 16, 14, 16, 46, 26]):
    Q.column_dimensions[c].width = w
hdr_fields = [('Client', 'Example client (overwrite)'), ('Project', 'International Speaker Programme – example'),
              ('Quote Date', dt.date(2026, 11, 10)), ('Quote Reference', 'OAM-Q-2026-0001'), ('GST Rate', '=GST_Default'),
              ('Validity (days)', 15)]
for i, (lab, val) in enumerate(hdr_fields):
    r = 4 + i
    put(Q, f'B{r}', lab, f_bold)
    put(Q, f'C{r}', val, f_in if not str(val).startswith('=') else f_link, DATE if lab == 'Quote Date' else (PCT if lab == 'GST Rate' else None), fill_input)
    Q.merge_cells(f'C{r}:E{r}')
qh = ['#', 'Service (pick from list)', 'Code', 'Unit', 'Pricing Basis', 'Rate Source', 'Manual Rate (₹ or %)', 'Quantity (base ₹ for % lines)',
      'Unit Rate Used', 'Amount (₹)', 'Rate Note', 'Historical Range (actual)']
header(Q, QL0 - 1, qh, inputs=(2, 6, 7, 8))
example = [
    ('SPK-001', 'Latest actual', None, 1),
    ('SPK-002', 'Manual', 288000, 1),
    ('SPK-003', 'Latest actual', None, f'=J{QL0 + 1}'),
    ('CRE-001', 'Latest actual', None, 1),
    ('WEB-001', 'Recommended', None, 1),
    ('CRE-002', 'Latest actual', None, 3),
    ('CRE-003', 'Recommended', None, 1),
]
labels = {s['code']: f"{s['code']} | {s['name']}" for s in seed['services']}
for i, r in enumerate(range(QL0, QL1 + 1)):
    put(Q, f'A{r}', i + 1, f_calc, '0')
    ex = example[i] if i < len(example) else (None, None, None, None)
    put(Q, f'B{r}', labels.get(ex[0]) if ex[0] else None, f_in, fill=fill_input)
    put(Q, f'C{r}', f'=IFERROR(LEFT($B{r},FIND(" | ",$B{r})-1),"")', f_calc)
    put(Q, f'D{r}', f'=IF($C{r}="","",IFERROR(INDEX(C_Unit,MATCH($C{r},C_Code,0)),""))', f_link)
    put(Q, f'E{r}', f'=IF($C{r}="","",IFERROR(INDEX(C_Basis,MATCH($C{r},C_Code,0)),""))', f_link)
    put(Q, f'F{r}', ex[1], f_in, fill=fill_input)
    put(Q, f'G{r}', ex[2], f_in, RATE, fill_input)
    put(Q, f'H{r}', ex[3], f_in if not isinstance(ex[3], str) else f_calc, '#,##0.##', fill_input)
    put(Q, f'I{r}', f'=IF($C{r}="","",IF($F{r}="Manual",IF(ISNUMBER($G{r}),$G{r},""),IFERROR(1*IF($F{r}="Latest actual",INDEX(A_Latest,MATCH($C{r},A_Code,0)),IF($F{r}="Median actual",INDEX(A_Median,MATCH($C{r},A_Code,0)),IF($F{r}="Recommended",INDEX(A_Rec,MATCH($C{r},A_Code,0)),""))),"")))', f_link, RATE)
    put(Q, f'J{r}', f'=IF(OR($I{r}="",$H{r}=""),0,$H{r}*$I{r})', f_calc, INR)
    put(Q, f'K{r}', f'=IF($C{r}="","",IF($F{r}="","Choose a rate source",IF($I{r}="",IF($E{r}="At actuals","Billed at actuals: choose Manual and enter the amount",IF($E{r}="Quoted separately","No price on record: choose Manual","No "&LOWER($F{r})&" rate on record: choose Manual")),IF($F{r}="Manual","Manual rate (not from history)",IF($E{r}="Percentage","Rate is a % of the quantity (base amount)","")))))', f_calc)
    put(Q, f'L{r}', f'=IF($C{r}="","",IFERROR(IF(INDEX(A_Count,MATCH($C{r},A_Code,0))=0,"No actual quotes",TEXT(INDEX(A_Min,MATCH($C{r},A_Code,0)),IF($E{r}="Percentage","0%","#,##0.##"))&" – "&TEXT(INDEX(A_Max,MATCH($C{r},A_Code,0)),IF($E{r}="Percentage","0%","#,##0.##"))&" ("&INDEX(A_Count,MATCH($C{r},A_Code,0))&" quotes)"),""))', f_calc)
dv_list(Q, '=C_Label', f'B{QL0}:B{QL1}', 'Pick a service from the catalogue.')
dv_list(Q, '=L_RateSource', f'F{QL0}:F{QL1}', 'Latest actual / Median actual / Recommended use history; Manual uses your rate in column G.')
Q.conditional_formatting.add(f'K{QL0}:K{QL1}', FormulaRule(formula=[f'LEFT($K{QL0},6)="Manual"'], font=Font(name=F, color='0000FF', italic=True)))
Q.conditional_formatting.add(f'K{QL0}:K{QL1}', FormulaRule(formula=[f'AND($K{QL0}<>"",$I{QL0}="")'], fill=amber))
Q.conditional_formatting.add(f'I{QL0}:I{QL1}', FormulaRule(formula=[f'$E{QL0}="Percentage"'], font=Font(name=F, color='008000')))
tr = QL1 + 2
totals = [('Subtotal (₹)', f'=SUM(J{QL0}:J{QL1})'),
          ('  of which pass-through at actuals (₹)', f'=SUMIFS(J{QL0}:J{QL1},E{QL0}:E{QL1},"At actuals")'),
          ('GST (₹)', f'=ROUND(J{tr}*$C$8,2)'),
          ('GRAND TOTAL (₹)', f'=J{tr}+J{tr + 2}')]
for i, (lab, fml) in enumerate(totals):
    r = tr + i
    put(Q, f'I{r}', lab, f_bold, align=Alignment(horizontal='right'))
    put(Q, f'J{r}', fml, Font(name=F, size=11 if i == 3 else 10, bold=i in (0, 3), color=NAVY), INR, fill_kpi if i == 3 else None)
put(Q, f'B{tr}', 'Lines with a rate need a quantity; lines without a rate count as zero until you enter a Manual rate.', f_sub)
put(Q, f'B{tr + 2}', 'Payment terms', f_bold); put(Q, f'C{tr + 2}', '60% advance on initiation, 40% on submission of final handover report', f_in, fill=fill_input); Q.merge_cells(f'C{tr + 2}:H{tr + 2}')
put(Q, f'B{tr + 3}', 'Notes', f_bold); put(Q, f'C{tr + 3}', 'Speaker honorarium billed at actuals with 10% processing and co-ordination fee. GST @ 18% extra; TDS as applicable.', f_in, fill=fill_input); Q.merge_cells(f'C{tr + 3}:H{tr + 3}')
put(Q, f'B{tr + 5}', 'Check: the example above should equal the Sun Pharma / Dr. Reddy’s ISP subtotal of ₹5,01,800 →', f_sub)
put(Q, f'J{tr + 5}', f'=IF(ABS(J{tr}-INDEX(SD_Subtotal,MATCH("D06",SD_ID,0)))<=1,"Matches D06","Differs from D06")', f_calc)
pct_rule(Q, f'I{QL0}:I{QL1}', f'$E{QL0}="Percentage"'); pct_rule(Q, f'G{QL0}:G{QL1}', f'$E{QL0}="Percentage"')
Q.freeze_panes = f'A{QL0}'

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
]
put(B, 'D4', 'DATA QUALITY FLAGS', f_hdr, fill=fill_hdr); put(B, 'E4', 'Count', f_hdr, fill=fill_hdr, align=center)
for i, (lab, fml) in enumerate(dq):
    r = 5 + i
    put(B, f'D{r}', lab, f_body, fill=fill_kpi); put(B, f'E{r}', fml, Font(name=F, size=11, bold=True, color=NAVY), '0', fill_kpi)
B.conditional_formatting.add('E5:E13', CellIsRule(operator='greaterThan', formula=['0'], fill=amber))
B.conditional_formatting.add('E5:E13', CellIsRule(operator='equal', formula=['0'], fill=green))
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
notes = [n['message'] for n in seed['review_notes']] + [
    'Speaker honorarium FX rates differ: €1 = ₹113 (D01); US$1 = ₹98 (D02); US$1 = ₹96 (D05, D06). Fix one reference rate or quote “at the day’s rate”.',
    'Two webinar streaming tiers exist: ₹50,000 for a 60-minute single-expert webinar (WEB-002) and ₹75,000 for a 1.5-hour multi-speaker webinar (WEB-001). They are separate services, not duplicates.',
    'D01 (Cipla ISP, Jun 2026) is marked Superseded because D02 is its updated version. Change Record Status back to Current in the Master if both should count.',
]
for i, n in enumerate(notes):
    r = rn0 + 1 + i
    put(B, f'A{r}', f'{i + 1}. {n}', f_body, align=wrap); B.merge_cells(f'A{r}:L{r}'); B.row_dimensions[r].height = 28

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
]
for i, (lid, sheet, rec, ctype, desc, prev, new, srcdoc) in enumerate(log):
    r = 5 + i
    for j, v in enumerate([lid, dt.date(2026, 11, 10), 'Claude (for OneAlphaMed BD)', sheet, rec, ctype, desc, prev, new, srcdoc, None], start=1):
        put(U, f'{CL(j)}{r}', v, f_in, DATE if j == 2 else None, align=wrap if j == 7 else None)
for r in range(5 + len(log), 300):
    for j in range(1, 12):
        put(U, f'{CL(j)}{r}', None, f_in, DATE if j == 2 else None)
dv_list(U, '=L_ChangeType', 'F5:F299')
U.conditional_formatting.add('A5:A299', FormulaRule(formula=['AND($A5<>"",COUNTIF($A$5:$A$299,$A5)>1)'], fill=red))
U.freeze_panes = 'A5'; U.auto_filter.ref = 'A4:K299'

# ================================================================ Read Me
R = ws['readme']
title(R, 'OneAlphaMed Pricing Master', 'Consolidated product- and service-wise pricing from OneAlphaMed client proposals. Prepared 10 Nov 2026.')
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
    (SHEET['quote'], 'Pick services, choose Latest actual / Median actual / Recommended / Manual, enter quantities; GST and totals calculate.'),
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
    ('COLOUR KEY', None),
    ('Blue text', 'Hardcoded input typed from a document; edit these.'),
    ('Black text', 'Formula; do not overwrite.'),
    ('Green text', 'Formula pulling from another sheet.'),
    ('Yellow fill', 'Input cell on the Quotation Calculator and Settings.'),
    ('Blue header', 'Input column. Navy header = calculated column.'),
    ('Amber / red fill', 'Flag to review (inconsistent rate, duplicate, mismatch).'),
    ('Grey italic row', 'Superseded record, kept for history.'),
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
    s.page_setup.orientation = 'landscape'; s.page_setup.fitToWidth = 1; s.page_setup.fitToHeight = 0
    s.sheet_properties.pageSetUpPr.fitToPage = True
wb.calculation.fullCalcOnLoad = True
wb.active = 0
wb.save(OUT)
print('saved', OUT, 'rows', len(rows), 'docs', len(docs), 'services', len(seed['services']))
