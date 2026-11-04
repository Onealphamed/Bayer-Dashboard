import json, sys, html
sys.path.insert(0, sys.argv[1])
from content import COMPANIES, TRACKS, CREATIVES, FOLLOWUPS, OFFERINGS, ASK, SIGNATURE

summary = json.load(open(sys.argv[2]))
OUT = sys.argv[3]

data = dict(
    companies=[dict(name=n, **{k: v for k, v in c.items()}) for n, c in COMPANIES.items()],
    tracks=[{k: v for k, v in t.items() if k != "kw"} | {"kw": t["kw"][:8]} for t in TRACKS],
    creatives=CREATIVES, followups=FOLLOWUPS, offerings=OFFERINGS, ask=ASK, signature=SIGNATURE,
    summary=summary["summary"], trackcounts=summary["tracks"],
)

page = r"""<title>Pharma Outreach Kit</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
/* Layout: a working desk. Controls on the left, the email as a letter sheet on the right; sequence, creatives and send plan below. */
:root{
  --bg:#eef2f1; --sheet:#ffffff; --ink:#11272b; --muted:#56696c; --line:#d3dcdb;
  --accent:#0d6f68; --accent-ink:#ffffff; --tag-bg:#fdecc8; --tag-ink:#7a4a05;
  --warn-bg:#fde8e4; --warn-ink:#8f2a17; --ok-bg:#e0f1ec; --ok-ink:#145b49;
  --f-display:"Bricolage Grotesque", "IBM Plex Sans", system-ui, sans-serif;
  --f-ui:"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-letter:"Source Serif 4", Georgia, "Times New Roman", serif;
  --f-mono:"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#0f1a1c; --sheet:#172427; --ink:#e3ecea; --muted:#9ab0ad; --line:#2a3b3e;
  --accent:#4cc1b3; --accent-ink:#06211e; --tag-bg:#4a3510; --tag-ink:#ffd58f;
  --warn-bg:#46201a; --warn-ink:#ffb4a3; --ok-bg:#163a31; --ok-ink:#9fe3cc; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#0f1a1c; --sheet:#172427; --ink:#e3ecea; --muted:#9ab0ad; --line:#2a3b3e;
  --accent:#4cc1b3; --accent-ink:#06211e; --tag-bg:#4a3510; --tag-ink:#ffd58f;
  --warn-bg:#46201a; --warn-ink:#ffb4a3; --ok-bg:#163a31; --ok-ink:#9fe3cc; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:15px/1.55 var(--f-ui)}
.wrap{max-width:1180px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:40px}
header{display:grid;gap:8px}
.eyebrow{font:500 12px/1 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
h1{font:700 clamp(30px,5vw,46px)/1.05 var(--f-display);margin:0;text-wrap:balance;letter-spacing:-.01em}
h2{font:700 24px/1.2 var(--f-display);margin:0 0 4px;text-wrap:balance}
.lede{max-width:68ch;color:var(--muted);margin:0}
.desk{display:grid;grid-template-columns:280px minmax(0,1fr);gap:28px;align-items:start}
@media (max-width:860px){.desk{grid-template-columns:minmax(0,1fr)}}
.controls{display:grid;gap:22px;position:sticky;top:calc(env(safe-area-inset-top,0px) + 16px)}
@media (max-width:860px){.controls{position:static}}
.group{display:grid;gap:8px}
.label{font:600 11px/1 var(--f-ui);letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.cos{display:grid;gap:6px}
.co{all:unset;cursor:pointer;display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--sheet);font:500 15px/1.2 var(--f-ui)}
.co small{font:400 12px/1 var(--f-mono);color:var(--muted);font-variant-numeric:tabular-nums}
.co[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.co[aria-pressed="true"] small{color:var(--accent-ink);opacity:.8}
.co:focus-visible,select:focus-visible,.btn:focus-visible,.seg button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
select{width:100%;font:15px var(--f-ui);padding:9px 10px;border-radius:8px;border:1px solid var(--line);background:var(--sheet);color:var(--ink)}
.seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--sheet)}
.seg button{all:unset;cursor:pointer;flex:1;text-align:center;padding:8px 6px;font:500 13px var(--f-ui)}
.seg button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
.hint{font-size:13px;color:var(--muted);margin:0}
.sheet{background:var(--sheet);border:1px solid var(--line);border-radius:6px;box-shadow:0 1px 0 var(--line),0 18px 40px -28px rgba(10,40,40,.35);min-width:0}
.meta{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px 14px;align-items:baseline;padding:18px 24px;border-bottom:1px solid var(--line);font-size:14px}
.meta dt{color:var(--muted);font:500 12px var(--f-ui);text-transform:uppercase;letter-spacing:.07em}
.meta dd{margin:0;min-width:0;overflow-wrap:anywhere}
.subject{font:600 17px/1.35 var(--f-ui)}
.letter{padding:22px 24px 26px;font:17px/1.6 var(--f-letter);max-width:70ch}
.letter p{margin:0 0 14px}
.letter ul{margin:0 0 14px;padding-left:20px;display:grid;gap:4px}
.letter li b{font-weight:600}
.sig{white-space:pre-line;color:var(--ink)}
.sig .small{font:14px var(--f-ui);color:var(--muted)}
.tag{font:500 .82em var(--f-mono);background:var(--tag-bg);color:var(--tag-ink);padding:1px 5px;border-radius:4px;white-space:nowrap}
.fill{background:transparent;border-bottom:1.5px dotted var(--accent);font-family:inherit}
.btn{all:unset;cursor:pointer;font:500 13px var(--f-ui);padding:7px 12px;border-radius:7px;border:1px solid var(--line);background:var(--bg);white-space:nowrap}
.btn:hover{border-color:var(--accent)}
.actions{display:flex;flex-wrap:wrap;gap:8px;padding:0 24px 22px}
.attach{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;gap:6px;align-items:center;font:500 13px var(--f-ui);padding:4px 10px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-decoration:none}
.chip:hover{border-color:var(--accent)}
.chip i{font-style:normal;font:400 11px var(--f-mono);color:var(--muted)}
.toast{font:13px var(--f-ui);color:var(--ok-ink)}
section{display:grid;gap:16px}
.seq{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@media (max-width:900px){.seq{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){.seq{grid-template-columns:minmax(0,1fr)}}
.step{background:var(--sheet);border:1px solid var(--line);border-radius:8px;padding:16px;display:grid;gap:8px;align-content:start;min-width:0}
.day{font:700 28px/1 var(--f-display);color:var(--accent);font-variant-numeric:tabular-nums}
.day span{font:500 12px var(--f-mono);color:var(--muted);margin-left:6px;letter-spacing:.04em;text-transform:uppercase}
.step h3{font:600 15px/1.3 var(--f-ui);margin:0}
.step .s{font:500 13px var(--f-mono);color:var(--muted);overflow-wrap:anywhere}
.step p{margin:0;font:14px/1.5 var(--f-letter)}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--sheet)}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
th{font:600 11px var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--bg)}
tr:last-child td{border-bottom:0}
td.n{font-variant-numeric:tabular-nums;text-align:right;font-family:var(--f-mono)}
th.n{text-align:right}
.pill{display:inline-block;font:600 11px/1 var(--f-ui);padding:4px 8px;border-radius:999px;letter-spacing:.03em;white-space:nowrap}
.pill.warn{background:var(--warn-bg);color:var(--warn-ink)}
.pill.ok{background:var(--ok-bg);color:var(--ok-ink)}
.pill.q{background:var(--tag-bg);color:var(--tag-ink)}
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.note{border-left:3px solid var(--accent);padding:4px 0 4px 14px;font-size:14px}
.note b{display:block;margin-bottom:2px}
a{color:var(--accent)}
@media (prefers-reduced-motion:no-preference){.letter{transition:opacity .15s}}
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">OneAlphaMed · BD outreach · Nov 2026</div>
    <h1>Pharma Outreach Kit</h1>
    <p class="lede">Standard first-touch emails and follow-ups for Cipla, Dr. Reddy's, Sun Pharma and Torrent. Each email opens with our work for that company, adds one line for the contact's therapy area, lists all our offerings, and asks for a 20-minute meeting. Personalised copies for every contact are in the mail-merge workbook.</p>
  </header>

  <div class="desk">
    <aside class="controls">
      <div class="group">
        <span class="label" id="lbl-co">Company</span>
        <div class="cos" id="cos" role="group" aria-labelledby="lbl-co"></div>
      </div>
      <div class="group">
        <label class="label" for="track">Therapy or function track</label>
        <select id="track"></select>
        <p class="hint" id="trackhint"></p>
      </div>
      <div class="group">
        <span class="label" id="lbl-view">Show</span>
        <div class="seg" role="group" aria-labelledby="lbl-view">
          <button type="button" id="v-tags" aria-pressed="true">Merge fields</button>
          <button type="button" id="v-sample" aria-pressed="false">Sample values</button>
        </div>
        <p class="hint">Sample values use a made-up contact so you can read the email as it lands.</p>
      </div>
    </aside>

    <article class="sheet" aria-live="polite">
      <dl class="meta">
        <dt>To</dt><dd id="m-to"></dd><dd></dd>
        <dt>Subject</dt><dd class="subject" id="m-subj"></dd><dd><button class="btn" id="c-subj" type="button">Copy</button></dd>
        <dt>Alt.</dt><dd id="m-alt" style="color:var(--muted)"></dd><dd></dd>
        <dt>Attach</dt><dd class="attach" id="m-att"></dd><dd></dd>
      </dl>
      <div class="letter" id="letter"></div>
      <div class="actions">
        <button class="btn" id="c-body" type="button">Copy email body</button>
        <span class="toast" id="toast" role="status"></span>
      </div>
    </article>
  </div>

  <section>
    <div><h2>Follow-up sequence</h2><p class="lede">Send these only if there's no reply. Stop the moment someone answers. Each follow-up replies on the same thread.</p></div>
    <div class="seq" id="seq"></div>
  </section>

  <section>
    <div><h2>Who gets what</h2><p class="lede">Wave 1 is CXOs, VPs, heads and senior managers with a verified company email. Wave 2 is brand and product managers. Hold covers anyone with no email, an email on another company's domain, or a note that they may have moved.</p></div>
    <div class="tablewrap"><table id="plan"></table></div>
    <div class="tablewrap"><table id="tracks"></table></div>
  </section>

  <section>
    <div><h2>Creatives to attach</h2><p class="lede">Attach the files to the email instead of pasting Drive links. Sharing was checked on 4 Nov 2026, and some links are private or editable by anyone.</p></div>
    <div class="tablewrap"><table id="creatives"></table></div>
  </section>

  <section>
    <h2>Before you send</h2>
    <div class="notes">
      <div class="note"><b>Fix Drive sharing</b>DRL.png, Zoho Emailer 1 and the KOLverse one-pager are set to "anyone with the link can edit". Change them to Viewer. The Cipla HSS case study, Oscar case study and Sun Flyer 2 are private to info@.</div>
      <div class="note"><b>Pick the sender</b>No sign-off is defined in the playbook. Send each company's emails from its BD owner's own mailbox (Blessy for DRL, Jigna for Sun Pharma in the contact sheets) and fill in the name and title.</div>
      <div class="note"><b>Cipla wording</b>Healthcare Superstars was built for Cipla's EMEU team. For Cipla India contacts the line stays accurate, but don't attach the HSS results emailer, which names Cipla reps.</div>
      <div class="note"><b>Torrent and Dr. Reddy's are thin</b>Torrent has one emailable contact and Dr. Reddy's has three senior ones. Most others are on hold for missing or mismatched emails. Enrich these first.</div>
      <div class="note"><b>No prices, no deck</b>Following the BD playbook, the first email asks for a meeting. Send the brochure only when someone asks for it.</div>
      <div class="note"><b>Pace it</b>Send a few emails a day per mailbox from a real inbox, not a bulk tool, so they don't land in spam at cipla.com or sunpharma.com.</div>
    </div>
  </section>
</div>

<script id="kit" type="application/json">__DATA__</script>
<script>
(function(){
  const D = JSON.parse(document.getElementById('kit').textContent);
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const SAMPLE = {FirstName:'Priya', SenderName:'[Your name]', SenderTitle:'[Your title]'};
  const shareLabel = {private:['Private to info@','warn'], edit:['Anyone can edit','warn'], unknown:['Check sharing','q']};
  let st = {co:0, tr:0, sample:false};
  try { const s = JSON.parse(localStorage.getItem('kit-state')||'null'); if (s) st = Object.assign(st, s); } catch(e){}
  const save = () => { try { localStorage.setItem('kit-state', JSON.stringify(st)); } catch(e){} };

  function vals(co, tr){
    const company = co.name === 'Torrent Pharma' ? 'Torrent' : co.name;
    return Object.assign({}, SAMPLE, {TeamName: tr.team, TeamShort: tr.key==='general' ? company : tr.label, Company: company});
  }
  function fmt(s, v, html){
    return s.replace(/\{(\w+)\}/g, (m, k) => {
      if (!st.sample || !(k in v)) return html ? '<span class="tag">{'+k+'}</span>' : '{'+k+'}';
      return html ? '<span class="fill">'+esc(v[k])+'</span>' : v[k];
    });
  }
  function h(s, v){ return fmt(esc(s), v, true); }

  function bodyText(co, tr, v){
    const L = ['Hi {FirstName},', '', co.opener, '', tr.line, '', 'What we do, in one place:'];
    D.offerings.forEach(o => L.push('• ' + o[0] + ': ' + o[1]));
    L.push('', D.ask, '', ...D.signature);
    return fmt(L.join('\n'), v, false);
  }
  function attachments(co, tr){
    const a = [D.creatives[co.creative]];
    if (D.creatives[tr.creative].title !== a[0].title) a.push(D.creatives[tr.creative]);
    return a;
  }

  function render(){
    const co = D.companies[st.co], tr = D.tracks[st.tr], v = vals(co, tr);
    document.querySelectorAll('.co').forEach((b,i) => b.setAttribute('aria-pressed', i===st.co));
    $('v-tags').setAttribute('aria-pressed', !st.sample); $('v-sample').setAttribute('aria-pressed', st.sample);
    $('track').value = st.tr;
    $('trackhint').textContent = tr.kw.length ? 'Chosen when the title or division mentions: ' + tr.kw.join(', ') + '.' : 'Used when no therapy or function keyword matches.';
    $('m-to').innerHTML = h('{FirstName} · ' + co.name + ' · ' + tr.label, v);
    $('m-subj').innerHTML = h(co.subject, v);
    $('m-alt').innerHTML = h(co.subject_alt, v);
    $('m-att').innerHTML = attachments(co, tr).map(c => '<a class="chip" href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(c.title)+' <i>'+esc(c.size)+'</i></a>').join('');
    const offers = '<ul>' + D.offerings.map(o => '<li><b>'+esc(o[0])+':</b> '+esc(o[1])+'</li>').join('') + '</ul>';
    const sig = D.signature.map((l,i) => i===3 ? '<span class="small">'+h(l,v)+'</span>' : h(l,v)).join('\n');
    $('letter').innerHTML = '<p>'+h('Hi {FirstName},',v)+'</p><p>'+h(co.opener,v)+'</p><p>'+h(tr.line,v)+'</p><p>What we do, in one place:</p>'+offers+'<p>'+h(D.ask,v)+'</p><p class="sig">'+sig+'</p>';
    $('seq').innerHTML = '<div class="step"><div class="day">0<span>Day</span></div><h3>First email</h3><div class="s">'+h(co.subject,v)+'</div><p>The email shown above, with its attachments.</p></div>' +
      D.followups.map(f => '<div class="step"><div class="day">'+f.day+'<span>Day</span></div><h3>'+esc(f.name.replace(/^Follow-up \d: /,'').replace(/^./,c=>c.toUpperCase()))+'</h3><div class="s">'+h(f.subject.replace('{Subject}', co.subject),v)+'</div>'+f.body.slice(1).map(p=>'<p>'+h(p,v)+'</p>').join('')+'</div>').join('');
    save();
  }

  function copy(text){
    const t = $('toast');
    const done = m => { t.textContent = m; setTimeout(()=>{ t.textContent=''; }, 2200); };
    try {
      navigator.clipboard.writeText(text).then(() => done('Copied'), () => fallback());
    } catch(e){ fallback(); }
    function fallback(){
      const r = document.createRange(); r.selectNodeContents($('letter'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected. Press Ctrl+C or ⌘C to copy.');
    }
  }

  // Build controls
  $('cos').innerHTML = D.companies.map((c,i) => { const s = D.summary[c.name]; return '<button type="button" class="co" data-i="'+i+'">'+esc(c.name)+'<small>'+(s.w1+s.w2)+' ready</small></button>'; }).join('');
  $('cos').addEventListener('click', e => { const b = e.target.closest('.co'); if (b){ st.co = +b.dataset.i; render(); }});
  $('track').innerHTML = D.tracks.map((t,i) => '<option value="'+i+'">'+esc(t.label)+'</option>').join('');
  $('track').addEventListener('change', e => { st.tr = +e.target.value; render(); });
  $('v-tags').onclick = () => { st.sample = false; render(); };
  $('v-sample').onclick = () => { st.sample = true; render(); };
  $('c-subj').onclick = () => { const co = D.companies[st.co], tr = D.tracks[st.tr]; copy(fmt(co.subject, vals(co,tr), false)); };
  $('c-body').onclick = () => { const co = D.companies[st.co], tr = D.tracks[st.tr]; copy(bodyText(co, tr, vals(co,tr))); };

  // Static tables
  const S = D.summary, names = D.companies.map(c=>c.name);
  let tot = {w1:0,w2:0,hold:0};
  $('plan').innerHTML = '<thead><tr><th>Company</th><th class="n">Wave 1 · senior</th><th class="n">Wave 2 · managers</th><th class="n">Hold</th><th class="n">Total</th></tr></thead><tbody>' +
    names.map(n => { const s=S[n]; tot.w1+=s.w1; tot.w2+=s.w2; tot.hold+=s.hold; return '<tr><td>'+esc(n)+'</td><td class="n">'+s.w1+'</td><td class="n">'+s.w2+'</td><td class="n">'+s.hold+'</td><td class="n">'+(s.w1+s.w2+s.hold)+'</td></tr>'; }).join('') +
    '<tr><td><b>All four</b></td><td class="n"><b>'+tot.w1+'</b></td><td class="n"><b>'+tot.w2+'</b></td><td class="n"><b>'+tot.hold+'</b></td><td class="n"><b>'+(tot.w1+tot.w2+tot.hold)+'</b></td></tr></tbody>';
  const tc = D.trackcounts;
  $('tracks').innerHTML = '<thead><tr><th>Track (wave 1 + 2)</th>'+names.map(n=>'<th class="n">'+esc(n)+'</th>').join('')+'</tr></thead><tbody>' +
    D.tracks.map(t => '<tr><td>'+esc(t.label)+'</td>'+names.map(n=>'<td class="n">'+(tc[n+'|'+t.label]||'·')+'</td>').join('')+'</tr>').join('') + '</tbody>';
  $('creatives').innerHTML = '<thead><tr><th>File</th><th>What it shows</th><th>Used in</th><th>Sharing</th></tr></thead><tbody>' +
    Object.entries(D.creatives).map(([k,c]) => {
      const used = D.companies.filter(x=>x.creative===k).map(x=>x.name).concat(D.tracks.filter(t=>t.creative===k).map(t=>t.label+' track'));
      const sl = shareLabel[c.sharing];
      return '<tr><td><a href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(c.title)+'</a><br><span style="color:var(--muted);font-size:12px">'+esc(c.kind)+' · '+esc(c.size)+'</span></td><td>'+esc(c.shows)+'</td><td>'+(used.length?esc(used.join(', ')):'<span style="color:var(--muted)">On request</span>')+'</td><td><span class="pill '+sl[1]+'">'+sl[0]+'</span></td></tr>';
    }).join('') + '</tbody>';

  if (st.co >= D.companies.length) st.co = 0; if (st.tr >= D.tracks.length) st.tr = 0;
  render();
})();
</script>
"""
page = page.replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
open(OUT, "w").write(page)
print("wrote", OUT, len(page))
