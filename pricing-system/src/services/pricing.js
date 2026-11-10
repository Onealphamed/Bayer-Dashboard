import { tx, audit, clientId } from '../db/index.js';
import {
  Checker, ValidationError, RATE_TYPES, PRICING_BASES, DOC_STATUSES, QUOTE_STATUSES, RATE_SOURCES,
  round2, normaliseName,
} from './validate.js';
import { describe, recommend } from './stats.js';

const today = () => new Date().toISOString().slice(0, 10);
const notFound = (what) => new ValidationError([{ field: 'id', message: `${what} not found` }], 404);

/* ------------------------------------------------------------------ categories */

export function listCategories(db) {
  return db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id) AS service_count
                     FROM categories c ORDER BY c.name`).all();
}

export function createCategory(db, input, by = 'user') {
  const ck = new Checker();
  const code = ck.text(input, 'code', { required: true, max: 8 });
  const name = ck.text(input, 'name', { required: true, max: 120 });
  const description = ck.text(input, 'description', { max: 500 });
  if (code && !/^[A-Z]{2,8}$/.test(code)) ck.add('code', 'must be 2–8 capital letters');
  if (code && db.prepare('SELECT 1 FROM categories WHERE code = ?').get(code)) ck.add('code', 'already exists');
  if (name && db.prepare('SELECT 1 FROM categories WHERE name = ? COLLATE NOCASE').get(name)) ck.add('name', 'already exists');
  ck.done();
  const id = Number(db.prepare('INSERT INTO categories(code, name, description) VALUES (?, ?, ?)').run(code, name, description).lastInsertRowid);
  audit(db, 'create', 'category', id, { code, name, by });
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

/* ------------------------------------------------------------------ services */

const SERVICE_SELECT = `
  SELECT s.*, c.code AS category_code, c.name AS category_name,
    (SELECT group_concat(alias, ' | ') FROM service_aliases a WHERE a.service_id = s.id) AS aliases
  FROM services s JOIN categories c ON c.id = s.category_id`;

export function getServiceRow(db, id) {
  return db.prepare(`${SERVICE_SELECT} WHERE s.id = ?`).get(id);
}

function nextServiceCode(db, categoryCode) {
  const rows = db.prepare('SELECT code FROM services WHERE code LIKE ?').all(`${categoryCode}-%`);
  const max = rows.reduce((m, r) => Math.max(m, Number(r.code.split('-')[1]) || 0), 0);
  return `${categoryCode}-${String(max + 1).padStart(3, '0')}`;
}

export function createService(db, input, by = 'user') {
  const ck = new Checker();
  const name = ck.text(input, 'name', { required: true, max: 160 });
  const unit = ck.text(input, 'unit', { required: true, max: 60 });
  const pricing_basis = ck.oneOf(input, 'pricing_basis', PRICING_BASES, { fallback: 'fixed' });
  const description = ck.text(input, 'description', { max: 1000 });
  let category = null;
  if (input.category_id != null) category = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(input.category_id));
  else if (input.category_code) category = db.prepare('SELECT * FROM categories WHERE code = ?').get(input.category_code);
  if (!category) ck.add('category_id', 'must be an existing category');
  let code = ck.text(input, 'code', { max: 12 });
  if (code && !/^[A-Z]{2,8}-\d{3}$/.test(code)) ck.add('code', 'must look like ABC-001');
  if (code && db.prepare('SELECT 1 FROM services WHERE code = ?').get(code)) ck.add('code', 'already exists');
  if (name) {
    const norm = normaliseName(name);
    const clash = db.prepare('SELECT id, code, name FROM services').all().find((s) => normaliseName(s.name) === norm);
    if (clash) ck.add('name', `duplicates existing service ${clash.code} “${clash.name}”`);
  }
  ck.done();
  code = code || nextServiceCode(db, category.code);
  const aliases = Array.isArray(input.aliases) ? input.aliases.map((a) => String(a).trim()).filter(Boolean) : [];
  return tx(db, () => {
    const id = Number(db.prepare(`INSERT INTO services(code, category_id, name, unit, pricing_basis, description)
      VALUES (?, ?, ?, ?, ?, ?)`).run(code, category.id, name, unit, pricing_basis, description).lastInsertRowid);
    const ins = db.prepare('INSERT OR IGNORE INTO service_aliases(service_id, alias) VALUES (?, ?)');
    for (const a of aliases) ins.run(id, a);
    audit(db, 'create', 'service', id, { code, name, by });
    return getServiceRow(db, id);
  });
}

export function updateService(db, id, input, by = 'user') {
  const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!svc) throw notFound('Service');
  const ck = new Checker();
  const fields = {};
  if ('name' in input) fields.name = ck.text(input, 'name', { required: true, max: 160 });
  if ('description' in input) fields.description = ck.text(input, 'description', { max: 1000 });
  if ('status' in input) fields.status = ck.oneOf(input, 'status', ['active', 'archived'], { required: true });
  if ('category_id' in input) {
    if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(Number(input.category_id))) ck.add('category_id', 'must be an existing category');
    else fields.category_id = Number(input.category_id);
  }
  const hasRates = db.prepare('SELECT COUNT(*) AS n FROM rate_records WHERE service_id = ?').get(id).n > 0;
  for (const f of ['unit', 'pricing_basis']) {
    if (f in input && input[f] !== svc[f]) {
      if (hasRates) ck.add(f, 'cannot change once rates are recorded (it would change the meaning of history); create a new service instead');
      else fields[f] = f === 'pricing_basis' ? ck.oneOf(input, f, PRICING_BASES, { required: true }) : ck.text(input, f, { required: true, max: 60 });
    }
  }
  if (fields.name) {
    const norm = normaliseName(fields.name);
    const clash = db.prepare('SELECT id, code, name FROM services WHERE id <> ?').all(id).find((s) => normaliseName(s.name) === norm);
    if (clash) ck.add('name', `duplicates existing service ${clash.code} “${clash.name}”`);
  }
  ck.done();
  const keys = Object.keys(fields);
  if (keys.length) {
    db.prepare(`UPDATE services SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(...keys.map((k) => fields[k]), id);
    audit(db, 'update', 'service', id, { before: svc, changes: fields, by });
  }
  return getServiceRow(db, id);
}

export function addAlias(db, serviceId, alias) {
  if (!db.prepare('SELECT 1 FROM services WHERE id = ?').get(serviceId)) throw notFound('Service');
  const ck = new Checker();
  const a = ck.text({ alias }, 'alias', { required: true, max: 160 });
  ck.done();
  db.prepare('INSERT OR IGNORE INTO service_aliases(service_id, alias) VALUES (?, ?)').run(serviceId, a);
  return getServiceRow(db, serviceId);
}

/* ------------------------------------------------------------------ documents */

const DOC_SELECT = `
  SELECT d.id, d.doc_key, d.title, d.file_type, d.project, d.document_date, d.date_precision, d.reference_no,
    d.currency, d.quoted_subtotal, d.quoted_gst, d.quoted_grand_total, d.payment_terms, d.validity_days, d.status,
    d.origin, d.drive_file_id, d.drive_url, d.drive_modified, d.file_size_bytes, d.original_filename, d.stored_file,
    d.mime_type, d.sha256, d.extraction_status, d.notes, d.created_at, c.name AS client, d.client_id,
    (SELECT COUNT(*) FROM current_rates r WHERE r.document_id = d.id) AS line_count,
    (SELECT round(SUM(r.amount), 2) FROM current_rates r WHERE r.document_id = d.id AND r.is_optional = 0) AS lines_total
  FROM source_documents d LEFT JOIN clients c ON c.id = d.client_id`;

export function listDocuments(db) {
  return db.prepare(`${DOC_SELECT} ORDER BY d.document_date DESC, d.id DESC`).all();
}

export function getDocument(db, id) {
  const doc = db.prepare(`${DOC_SELECT} WHERE d.id = ?`).get(id);
  if (!doc) throw notFound('Document');
  doc.lines = listRates(db, { document_id: id, include_superseded: true });
  return doc;
}

export function createDocument(db, input, file = null, by = 'user') {
  const ck = new Checker();
  const title = ck.text(input, 'title', { required: true, max: 300 });
  const document_date = ck.date(input, 'document_date', { required: true });
  const date_precision = ck.oneOf(input, 'date_precision', ['day', 'month'], { fallback: 'day' });
  const client = ck.text(input, 'client', { max: 160 });
  const project = ck.text(input, 'project', { max: 300 });
  const reference_no = ck.text(input, 'reference_no', { max: 80 });
  const status = ck.oneOf(input, 'status', DOC_STATUSES, { fallback: 'proposal' });
  const origin = ck.oneOf(input, 'origin', ['drive_seed', 'upload', 'manual'], { fallback: file ? 'upload' : 'manual' });
  const quoted_subtotal = ck.number(input, 'quoted_subtotal', { min: 0 });
  const quoted_gst = ck.number(input, 'quoted_gst', { min: 0 });
  const quoted_grand_total = ck.number(input, 'quoted_grand_total', { min: 0 });
  const validity_days = ck.number(input, 'validity_days', { gt: 0 });
  const payment_terms = ck.text(input, 'payment_terms', { max: 500 });
  const notes = ck.text(input, 'notes', { max: 4000 });
  const drive_file_id = ck.text(input, 'drive_file_id', { max: 120 });
  let doc_key = ck.text(input, 'doc_key', { max: 80 });
  if (doc_key && db.prepare('SELECT 1 FROM source_documents WHERE doc_key = ?').get(doc_key)) ck.add('doc_key', 'already exists');
  if (file?.sha256) {
    const dup = db.prepare('SELECT id, title FROM source_documents WHERE sha256 = ?').get(file.sha256);
    if (dup) {
      ck.add('file', `this exact file is already archived as document #${dup.id} “${dup.title}”`);
      throw new ValidationError(ck.errors, 409);
    }
  }
  ck.done();
  doc_key = doc_key || `DOC-${document_date.slice(0, 7)}-${Date.now().toString(36).toUpperCase()}`;
  return tx(db, () => {
    const cid = clientId(db, client);
    const id = Number(db.prepare(`INSERT INTO source_documents(doc_key, title, file_type, client_id, project, document_date,
        date_precision, reference_no, quoted_subtotal, quoted_gst, quoted_grand_total, payment_terms, validity_days, status,
        origin, drive_file_id, drive_url, drive_modified, file_size_bytes, original_filename, stored_file, mime_type, sha256,
        extracted_text, extraction_status, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      doc_key, title, input.file_type || file?.extension || null, cid, project, document_date, date_precision, reference_no,
      quoted_subtotal, quoted_gst, quoted_grand_total, payment_terms, validity_days, status, origin, drive_file_id,
      drive_file_id ? `https://drive.google.com/file/d/${drive_file_id}/view` : null, input.drive_modified || null,
      file?.size ?? (input.file_size_bytes ?? null), file?.originalname ?? null, file?.stored ?? null, file?.mimetype ?? null,
      file?.sha256 ?? null, file?.text ?? null, file?.extraction_status ?? null, notes,
    ).lastInsertRowid);
    audit(db, 'create', 'document', id, { doc_key, title, by });
    return db.prepare(`${DOC_SELECT} WHERE d.id = ?`).get(id);
  });
}

export function updateDocument(db, id, input, by = 'user') {
  const doc = db.prepare('SELECT * FROM source_documents WHERE id = ?').get(id);
  if (!doc) throw notFound('Document');
  const ck = new Checker();
  const fields = {};
  if ('status' in input) fields.status = ck.oneOf(input, 'status', DOC_STATUSES, { required: true });
  if ('notes' in input) fields.notes = ck.text(input, 'notes', { max: 4000 });
  for (const k of Object.keys(input)) if (!['status', 'notes'].includes(k)) ck.add(k, 'cannot be changed; documents are preserved as recorded (only status and notes are editable)');
  ck.done();
  const keys = Object.keys(fields);
  if (keys.length) {
    db.prepare(`UPDATE source_documents SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => fields[k]), id);
    audit(db, 'update', 'document', id, { before: { status: doc.status, notes: doc.notes }, changes: fields, by });
  }
  return db.prepare(`${DOC_SELECT} WHERE d.id = ?`).get(id);
}

/* ------------------------------------------------------------------ rates */

const RATE_SELECT = `
  SELECT r.*, s.code AS service_code, s.name AS service_name, s.unit AS service_unit, c.name AS client,
    d.title AS document_title, d.doc_key, d.project, d.drive_url, d.status AS document_status,
    (SELECT new_rate_id FROM rate_corrections x WHERE x.old_rate_id = r.id) AS superseded_by,
    (SELECT old_rate_id FROM rate_corrections x WHERE x.new_rate_id = r.id) AS corrects,
    (SELECT reason FROM rate_corrections x WHERE x.new_rate_id = r.id) AS correction_reason
  FROM rate_records r
  JOIN services s ON s.id = r.service_id
  LEFT JOIN clients c ON c.id = r.client_id
  LEFT JOIN source_documents d ON d.id = r.document_id`;

export function listRates(db, f = {}) {
  const where = [];
  const params = [];
  if (!f.include_superseded) where.push('NOT EXISTS (SELECT 1 FROM rate_corrections x WHERE x.old_rate_id = r.id)');
  for (const [k, col] of [['service_id', 'r.service_id'], ['document_id', 'r.document_id'], ['client_id', 'r.client_id']]) {
    if (f[k] != null && f[k] !== '') { where.push(`${col} = ?`); params.push(Number(f[k])); }
  }
  if (f.rate_type) { where.push('r.rate_type = ?'); params.push(f.rate_type); }
  if (f.category_id) { where.push('s.category_id = ?'); params.push(Number(f.category_id)); }
  if (f.q) {
    where.push('(s.name LIKE ? OR s.code LIKE ? OR r.description LIKE ? OR c.name LIKE ? OR d.project LIKE ?)');
    const like = `%${f.q}%`;
    params.push(like, like, like, like, like);
  }
  const sql = `${RATE_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.effective_date DESC, r.id DESC`;
  return db.prepare(sql).all(...params);
}

export function getRate(db, id) {
  const row = db.prepare(`${RATE_SELECT} WHERE r.id = ?`).get(id);
  if (!row) throw notFound('Rate record');
  return row;
}

/** Validate one rate line and return the normalised values ready to insert. */
export function checkRate(db, input) {
  const ck = new Checker();
  const svc = db.prepare('SELECT * FROM services WHERE id = ? OR code = ?').get(Number(input.service_id) || -1, String(input.service_code || input.service || ''));
  if (!svc) { ck.add('service_id', 'must be an existing service'); ck.done(); }
  if (svc.status !== 'active') ck.add('service_id', `service ${svc.code} is archived`);
  if (svc.pricing_basis === 'quoted_separately') ck.add('service_id', `${svc.code} is marked “quoted separately”; change its pricing basis before recording a price`);
  const rate_type = ck.oneOf(input, 'rate_type', RATE_TYPES, { required: true });
  const basis = svc.pricing_basis;
  let doc = null;
  if (input.document_id != null && input.document_id !== '') {
    doc = db.prepare('SELECT * FROM source_documents WHERE id = ?').get(Number(input.document_id));
    if (!doc) ck.add('document_id', 'must be an existing source document');
  }
  if (rate_type === 'actual' && !doc) ck.add('document_id', 'an actual rate must cite its source document');
  if (rate_type === 'pass_through' && basis !== 'at_actuals') ck.add('rate_type', 'pass-through amounts are only for services billed at actuals');
  if (basis === 'at_actuals' && rate_type && !['pass_through', 'internal_cost'].includes(rate_type)) ck.add('rate_type', `${svc.code} is billed at actuals; use rate type pass_through`);
  const quantity = ck.number(input, 'quantity', { gt: 0 }) ?? 1;
  const unit_rate = ck.number(input, 'unit_rate', { required: true, min: 0, max: basis === 'percent' ? 100 : null });
  let amount = ck.number(input, 'amount', { min: 0 });
  if (unit_rate != null) {
    if (basis === 'percent') {
      if (amount == null) ck.add('amount', 'is required for percentage-based lines (the rupee amount shown in the document)');
    } else {
      const calc = round2(quantity * unit_rate);
      if (amount == null) amount = calc;
      else if (Math.abs(amount - calc) > 1) ck.add('amount', `does not equal quantity × rate (${quantity} × ${unit_rate} = ${calc})`);
    }
  }
  const effective_date = ck.date(input, 'effective_date', { fallback: doc?.document_date || null, required: true });
  const unit = ck.text(input, 'unit', { max: 60 }) || svc.unit;
  const original_currency = ck.text(input, 'original_currency', { max: 3 });
  const original_unit_amount = ck.number(input, 'original_unit_amount', { min: 0 });
  const fx_rate = ck.number(input, 'fx_rate', { gt: 0 });
  if (original_currency) {
    if (!/^[A-Z]{3}$/.test(original_currency)) ck.add('original_currency', 'must be a 3-letter currency code');
    if (original_unit_amount == null || fx_rate == null) ck.add('fx_rate', 'original amount and exchange rate are both required with an original currency');
    else if (unit_rate != null && Math.abs(original_unit_amount * fx_rate - unit_rate) > 1) ck.add('fx_rate', `original amount × exchange rate (${round2(original_unit_amount * fx_rate)}) does not equal the INR rate`);
  }
  const package_size = ck.number(input, 'package_size', { gt: 0 });
  const description = ck.text(input, 'description', { max: 1000 });
  const source_excerpt = ck.text(input, 'source_excerpt', { max: 2000, required: rate_type === 'actual' });
  const notes = ck.text(input, 'notes', { max: 2000 });
  const entered_by = ck.text(input, 'entered_by', { max: 80 }) || 'user';
  ck.done();
  return {
    service_id: svc.id, document_id: doc?.id ?? null,
    client_id: doc?.client_id ?? (input.client ? clientId(db, input.client) : null),
    rate_type, pricing_basis: basis, unit, quantity, unit_rate, amount, currency: 'INR',
    original_currency, original_unit_amount, fx_rate, package_size: package_size == null ? null : Math.round(package_size),
    is_optional: input.is_optional ? 1 : 0, effective_date, description, source_excerpt, notes, entered_by,
  };
}

function insertRate(db, v) {
  const cols = Object.keys(v);
  const id = Number(db.prepare(`INSERT INTO rate_records(${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(...cols.map((k) => v[k])).lastInsertRowid);
  audit(db, 'create', 'rate', id, { service_id: v.service_id, rate_type: v.rate_type, unit_rate: v.unit_rate, by: v.entered_by });
  return id;
}

/** Insert one or more rate lines atomically. All lines are validated before anything is written. */
export function createRates(db, lines) {
  if (!Array.isArray(lines) || !lines.length) throw new ValidationError([{ field: 'lines', message: 'at least one rate line is required' }]);
  const checked = [];
  const errors = [];
  lines.forEach((l, i) => {
    try { checked.push(checkRate(db, l)); } catch (e) {
      if (e instanceof ValidationError) errors.push(...e.errors.map((x) => ({ field: `lines[${i}].${x.field}`, message: x.message })));
      else throw e;
    }
  });
  if (errors.length) throw new ValidationError(errors);
  return tx(db, () => checked.map((v) => insertRate(db, v)));
}

/** Correct a rate: the original stays, a new record is added and linked. */
export function correctRate(db, id, changes, reason) {
  const old = db.prepare('SELECT * FROM rate_records WHERE id = ?').get(id);
  if (!old) throw notFound('Rate record');
  if (db.prepare('SELECT 1 FROM rate_corrections WHERE old_rate_id = ?').get(id)) {
    throw new ValidationError([{ field: 'id', message: 'this record has already been corrected; correct the newest version instead' }], 409);
  }
  if (!reason || !String(reason).trim()) throw new ValidationError([{ field: 'reason', message: 'is required' }]);
  const merged = { ...old, ...changes, service_id: old.service_id };
  delete merged.id; delete merged.created_at;
  const v = checkRate(db, merged);
  return tx(db, () => {
    const newId = insertRate(db, v);
    db.prepare('INSERT INTO rate_corrections(old_rate_id, new_rate_id, reason) VALUES (?, ?, ?)').run(id, newId, String(reason).trim());
    audit(db, 'correct', 'rate', id, { new_rate_id: newId, reason });
    return getRate(db, newId);
  });
}

/* ------------------------------------------------------------------ analytics & recommendations */

export function serviceAnalytics(db, serviceId = null) {
  const services = db.prepare(`${SERVICE_SELECT} ${serviceId ? 'WHERE s.id = ?' : ''} ORDER BY s.code`).all(...(serviceId ? [serviceId] : []));
  const rates = db.prepare(`SELECT r.*, c.name AS client, d.project, d.title AS document_title FROM current_rates r
                            LEFT JOIN clients c ON c.id = r.client_id LEFT JOIN source_documents d ON d.id = r.document_id`).all();
  const byService = new Map();
  for (const r of rates) {
    if (!byService.has(r.service_id)) byService.set(r.service_id, []);
    byService.get(r.service_id).push(r);
  }
  return services.map((s) => {
    const all = byService.get(s.id) || [];
    const sameUnit = all.filter((r) => r.unit === s.unit);
    const pick = (type) => sameUnit.filter((r) => r.rate_type === type);
    const actual = pick('actual');
    const cost = pick('internal_cost');
    const est = pick('estimated');
    const pass = pick('pass_through');
    const dates = actual.map((r) => r.effective_date).sort();
    const withDates = (st, rows) => (st ? { ...st, first_date: rows.map((r) => r.effective_date).sort()[0], last_date: rows.map((r) => r.effective_date).sort().at(-1) } : null);
    return {
      service_id: s.id, code: s.code, name: s.name, unit: s.unit, pricing_basis: s.pricing_basis, status: s.status,
      category_code: s.category_code, category_name: s.category_name,
      actual: actual.length ? { ...describe(actual.map((r) => r.unit_rate)), first_date: dates[0], last_date: dates.at(-1) } : null,
      internal_cost: withDates(describe(cost.map((r) => r.unit_rate)), cost),
      estimated: withDates(describe(est.map((r) => r.unit_rate)), est),
      pass_through: withDates(describe(pass.map((r) => r.unit_rate)), pass),
      clients: [...new Set(actual.map((r) => r.client).filter(Boolean))],
      other_unit_count: all.length - sameUnit.length,
      recommendation: recommend(s, actual, cost),
      observations: actual
        .sort((a, b) => (a.effective_date < b.effective_date ? -1 : a.effective_date > b.effective_date ? 1 : a.id - b.id))
        .map((r) => ({ id: r.id, date: r.effective_date, client: r.client, project: r.project, unit_rate: r.unit_rate, quantity: r.quantity, document_id: r.document_id, package_size: r.package_size })),
    };
  });
}

export function getServiceDetail(db, id) {
  const svc = getServiceRow(db, id);
  if (!svc) throw notFound('Service');
  return { ...svc, analytics: serviceAnalytics(db, id)[0], history: listRates(db, { service_id: id, include_superseded: true }) };
}

export function listServices(db, f = {}) {
  const analytics = new Map(serviceAnalytics(db).map((a) => [a.service_id, a]));
  let rows = db.prepare(`${SERVICE_SELECT} ORDER BY s.code`).all();
  if (f.category_id) rows = rows.filter((s) => s.category_id === Number(f.category_id));
  if (f.status) rows = rows.filter((s) => s.status === f.status);
  if (f.q) {
    const q = String(f.q).toLowerCase();
    rows = rows.filter((s) => `${s.code} ${s.name} ${s.aliases || ''} ${s.description || ''}`.toLowerCase().includes(q));
  }
  return rows.map((s) => {
    const a = analytics.get(s.id);
    return { ...s, actual: a.actual, recommendation: a.recommendation, has_internal_cost: !!a.internal_cost };
  });
}

export function acceptRecommendation(db, serviceId, by = 'user') {
  const a = serviceAnalytics(db, serviceId)[0];
  if (!a) throw notFound('Service');
  if (a.recommendation.status !== 'ok') throw new ValidationError([{ field: 'service_id', message: a.recommendation.rationale }], 409);
  const [id] = createRates(db, [{
    service_id: serviceId, rate_type: 'estimated', quantity: 1, unit_rate: a.recommendation.recommended,
    amount: a.pricing_basis === 'percent' ? 0 : undefined, effective_date: today(), entered_by: by,
    description: `Estimated rate from recommendation (${a.recommendation.method}, ${a.recommendation.confidence} confidence)`,
    notes: a.recommendation.rationale,
  }]);
  return getRate(db, id);
}

/* ------------------------------------------------------------------ comparison */

export function compareService(db, serviceId) {
  const a = serviceAnalytics(db, serviceId)[0];
  if (!a) throw notFound('Service');
  const median = a.actual?.median ?? null;
  return {
    service: { id: a.service_id, code: a.code, name: a.name, unit: a.unit, pricing_basis: a.pricing_basis },
    stats: a.actual,
    rows: a.observations.map((o) => ({ ...o, vs_median_pct: median ? round2(((o.unit_rate - median) / median) * 100) : null })),
  };
}

export function compareMatrix(db) {
  const analytics = serviceAnalytics(db).filter((a) => a.actual);
  const clients = [...new Set(analytics.flatMap((a) => a.clients))].sort();
  return {
    clients,
    rows: analytics.map((a) => {
      const cells = {};
      for (const c of clients) {
        const obs = a.observations.filter((o) => o.client === c);
        if (obs.length) cells[c] = { latest: obs.at(-1).unit_rate, count: obs.length, min: Math.min(...obs.map((o) => o.unit_rate)), max: Math.max(...obs.map((o) => o.unit_rate)) };
      }
      return { service_id: a.service_id, code: a.code, name: a.name, unit: a.unit, pricing_basis: a.pricing_basis, median: a.actual.median, cells };
    }),
  };
}

export function compareDocuments(db, ids) {
  const docs = ids.map((id) => getDocument(db, Number(id)));
  const services = new Map();
  for (const d of docs) for (const l of d.lines.filter((x) => !x.superseded_by)) {
    if (!services.has(l.service_id)) services.set(l.service_id, { service_id: l.service_id, code: l.service_code, name: l.service_name, cells: {} });
    services.get(l.service_id).cells[d.id] = { unit_rate: l.unit_rate, quantity: l.quantity, amount: l.amount, rate_type: l.rate_type };
  }
  return { documents: docs.map(({ lines, ...d }) => d), rows: [...services.values()].sort((a, b) => a.code.localeCompare(b.code)) };
}

/* ------------------------------------------------------------------ quotations */

export function priceOptions(db, serviceId) {
  const a = serviceAnalytics(db, serviceId)[0];
  if (!a) throw notFound('Service');
  const opts = [];
  const latest = a.observations.at(-1);
  if (latest) opts.push({ source: 'latest_actual', unit_rate: latest.unit_rate, rate_record_id: latest.id, label: `Latest actual (${latest.date}, ${latest.client || 'client not named'})` });
  if (a.actual && a.actual.count > 1) opts.push({ source: 'median_actual', unit_rate: a.actual.median, rate_record_id: null, label: `Median of ${a.actual.count} actual quotes` });
  if (a.recommendation.status === 'ok') opts.push({ source: 'recommended', unit_rate: a.recommendation.recommended, rate_record_id: null, label: `Recommended (${a.recommendation.confidence} confidence)` });
  return { service_id: a.service_id, pricing_basis: a.pricing_basis, unit: a.unit, options: opts, recommendation: a.recommendation };
}

/** Pure calculation used by the API (the browser shows the same maths, but the server is authoritative). */
export function calculateQuote(items, gstRate) {
  const lines = items.map((it, i) => {
    const qty = Number(it.quantity);
    const rate = Number(it.unit_rate);
    const amount = it.pricing_basis === 'percent' ? round2((qty * rate) / 100) : round2(qty * rate);
    return { ...it, line_no: i + 1, amount };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const gst_amount = round2((subtotal * Number(gstRate)) / 100);
  return { lines, subtotal, gst_amount, total: round2(subtotal + gst_amount) };
}

function checkQuote(db, input) {
  const ck = new Checker();
  const client_name = ck.text(input, 'client_name', { required: true, max: 160 });
  const project = ck.text(input, 'project', { max: 300 });
  const quote_date = ck.date(input, 'quote_date', { fallback: today() });
  const gst_rate = ck.number(input, 'gst_rate', { min: 0, max: 100 }) ?? 18;
  const status = ck.oneOf(input, 'status', QUOTE_STATUSES, { fallback: 'draft' });
  const notes = ck.text(input, 'notes', { max: 4000 });
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length) ck.add('items', 'add at least one line');
  const checked = items.map((it, i) => {
    const f = (name) => `items[${i}].${name}`;
    const svc = it.service_id ? db.prepare('SELECT * FROM services WHERE id = ?').get(Number(it.service_id)) : null;
    if (it.service_id && !svc) ck.add(f('service_id'), 'must be an existing service');
    const quantity = Number(it.quantity);
    const unit_rate = Number(it.unit_rate);
    if (!(quantity > 0)) ck.add(f('quantity'), 'must be > 0');
    if (!(unit_rate >= 0) || it.unit_rate === '' || it.unit_rate == null) ck.add(f('unit_rate'), 'must be a number ≥ 0');
    const rate_source = RATE_SOURCES.includes(it.rate_source) ? it.rate_source : (ck.add(f('rate_source'), `must be one of: ${RATE_SOURCES.join(', ')}`), null);
    const description = String(it.description || svc?.name || '').trim();
    if (!description) ck.add(f('description'), 'is required');
    const basis = svc ? (svc.pricing_basis === 'quoted_separately' ? 'fixed' : svc.pricing_basis) : 'fixed';
    if (basis === 'percent' && unit_rate > 100) ck.add(f('unit_rate'), 'is a percentage and must be ≤ 100');
    let rate_record_id = null;
    if (svc && ['latest_actual', 'median_actual', 'recommended'].includes(rate_source)) {
      const opt = priceOptions(db, svc.id).options.find((o) => o.source === rate_source);
      if (!opt) ck.add(f('rate_source'), `no ${rate_source.replace('_', ' ')} rate exists for ${svc.code}; enter the rate as manual`);
      else if (Math.abs(opt.unit_rate - unit_rate) > 0.01) ck.add(f('unit_rate'), `does not match the ${rate_source.replace('_', ' ')} rate (${opt.unit_rate}); choose “manual” to enter a different rate`);
      else rate_record_id = opt.rate_record_id;
    }
    if (rate_source && ['latest_actual', 'median_actual', 'recommended'].includes(rate_source) && !svc) ck.add(f('rate_source'), 'historical sources need a service');
    if (rate_source === 'pass_through_actuals' && svc && svc.pricing_basis !== 'at_actuals') ck.add(f('rate_source'), 'only for services billed at actuals');
    return { service_id: svc?.id ?? null, description, unit: it.unit || svc?.unit || null, pricing_basis: basis, quantity, unit_rate, rate_source, rate_record_id };
  });
  ck.done();
  return { client_name, project, quote_date, gst_rate, status, notes, items: checked };
}

function nextQuoteNo(db, date) {
  const year = date.slice(0, 4);
  const row = db.prepare("SELECT quote_no FROM quotations WHERE quote_no LIKE ? ORDER BY quote_no DESC LIMIT 1").get(`OAM-Q-${year}-%`);
  const n = row ? Number(row.quote_no.split('-').at(-1)) + 1 : 1;
  return `OAM-Q-${year}-${String(n).padStart(4, '0')}`;
}

function writeItems(db, quotationId, lines) {
  db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(quotationId);
  const ins = db.prepare(`INSERT INTO quotation_items(quotation_id, line_no, service_id, description, unit, pricing_basis, quantity, unit_rate, rate_source, rate_record_id, amount)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const l of lines) ins.run(quotationId, l.line_no, l.service_id, l.description, l.unit, l.pricing_basis, l.quantity, l.unit_rate, l.rate_source, l.rate_record_id, l.amount);
}

export function createQuotation(db, input, by = 'user') {
  const q = checkQuote(db, input);
  const calc = calculateQuote(q.items, q.gst_rate);
  return tx(db, () => {
    const quote_no = nextQuoteNo(db, q.quote_date);
    const id = Number(db.prepare(`INSERT INTO quotations(quote_no, client_name, project, quote_date, gst_rate, status, notes, subtotal, gst_amount, total)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(quote_no, q.client_name, q.project, q.quote_date, q.gst_rate, q.status, q.notes, calc.subtotal, calc.gst_amount, calc.total).lastInsertRowid);
    writeItems(db, id, calc.lines);
    audit(db, 'create', 'quotation', id, { quote_no, total: calc.total, by });
    return getQuotation(db, id);
  });
}

export function updateQuotation(db, id, input, by = 'user') {
  const existing = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  if (!existing) throw notFound('Quotation');
  if (existing.status !== 'draft') {
    const onlyStatus = Object.keys(input).every((k) => k === 'status');
    if (!onlyStatus) throw new ValidationError([{ field: 'status', message: `quotation is ${existing.status}; only drafts can be edited (status can still change)` }], 409);
    const ck = new Checker();
    const status = ck.oneOf(input, 'status', QUOTE_STATUSES, { required: true });
    ck.done();
    db.prepare("UPDATE quotations SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(status, id);
    audit(db, 'status', 'quotation', id, { from: existing.status, to: status, by });
    return getQuotation(db, id);
  }
  const q = checkQuote(db, { ...existing, items: undefined, ...input });
  const calc = calculateQuote(q.items, q.gst_rate);
  return tx(db, () => {
    db.prepare(`UPDATE quotations SET client_name=?, project=?, quote_date=?, gst_rate=?, status=?, notes=?, subtotal=?, gst_amount=?, total=?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(q.client_name, q.project, q.quote_date, q.gst_rate, q.status, q.notes, calc.subtotal, calc.gst_amount, calc.total, id);
    writeItems(db, id, calc.lines);
    audit(db, 'update', 'quotation', id, { total: calc.total, by });
    return getQuotation(db, id);
  });
}

export function getQuotation(db, id) {
  const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  if (!q) throw notFound('Quotation');
  q.items = db.prepare(`SELECT i.*, s.code AS service_code FROM quotation_items i LEFT JOIN services s ON s.id = i.service_id
                        WHERE i.quotation_id = ? ORDER BY i.line_no`).all(id);
  return q;
}

export function listQuotations(db) {
  return db.prepare('SELECT q.*, (SELECT COUNT(*) FROM quotation_items i WHERE i.quotation_id = q.id) AS line_count FROM quotations q ORDER BY q.id DESC').all();
}

/* ------------------------------------------------------------------ review notes & summary */

export function listReviewNotes(db) {
  return db.prepare(`SELECT n.*,
      CASE n.entity_type WHEN 'service' THEN (SELECT code || ' ' || name FROM services WHERE id = n.entity_id)
                         WHEN 'document' THEN (SELECT title FROM source_documents WHERE id = n.entity_id)
                         WHEN 'rate' THEN ('Rate #' || n.entity_id) END AS entity_label
    FROM review_notes n ORDER BY n.status, n.id DESC`).all();
}

export function createReviewNote(db, input) {
  const ck = new Checker();
  const severity = ck.oneOf(input, 'severity', ['info', 'warning', 'critical'], { fallback: 'info' });
  const entity_type = ck.oneOf(input, 'entity_type', ['service', 'document', 'rate', 'general'], { fallback: 'general' });
  const message = ck.text(input, 'message', { required: true, max: 2000 });
  const entity_id = input.entity_id == null || input.entity_id === '' ? null : Number(input.entity_id);
  if (entity_type !== 'general' && entity_id == null) ck.add('entity_id', 'is required for this entity type');
  ck.done();
  const id = Number(db.prepare('INSERT INTO review_notes(severity, entity_type, entity_id, message) VALUES (?,?,?,?)').run(severity, entity_type, entity_id, message).lastInsertRowid);
  return db.prepare('SELECT * FROM review_notes WHERE id = ?').get(id);
}

export function resolveReviewNote(db, id, resolution) {
  const n = db.prepare('SELECT * FROM review_notes WHERE id = ?').get(id);
  if (!n) throw notFound('Review note');
  const ck = new Checker();
  const r = ck.text({ resolution }, 'resolution', { required: true, max: 2000 });
  ck.done();
  db.prepare("UPDATE review_notes SET status = 'resolved', resolution = ?, resolved_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(r, id);
  audit(db, 'resolve', 'review_note', id, { resolution: r });
  return db.prepare('SELECT * FROM review_notes WHERE id = ?').get(id);
}

export function summary(db) {
  const one = (sql) => db.prepare(sql).get();
  return {
    categories: one('SELECT COUNT(*) AS n FROM categories').n,
    services: one("SELECT COUNT(*) AS n FROM services WHERE status = 'active'").n,
    services_with_actuals: one("SELECT COUNT(DISTINCT service_id) AS n FROM current_rates WHERE rate_type = 'actual'").n,
    services_without_price: one("SELECT COUNT(*) AS n FROM services s WHERE status = 'active' AND NOT EXISTS (SELECT 1 FROM current_rates r WHERE r.service_id = s.id AND r.rate_type IN ('actual','pass_through'))").n,
    documents: one('SELECT COUNT(*) AS n FROM source_documents').n,
    clients: one('SELECT COUNT(*) AS n FROM clients').n,
    rate_records: one('SELECT COUNT(*) AS n FROM rate_records').n,
    current_rates: one('SELECT COUNT(*) AS n FROM current_rates').n,
    by_type: db.prepare('SELECT rate_type, COUNT(*) AS n FROM current_rates GROUP BY rate_type').all(),
    corrections: one('SELECT COUNT(*) AS n FROM rate_corrections').n,
    quotations: one('SELECT COUNT(*) AS n FROM quotations').n,
    quoted_value: one('SELECT round(COALESCE(SUM(quoted_subtotal),0),2) AS v FROM source_documents').v,
    first_date: one('SELECT MIN(document_date) AS d FROM source_documents').d,
    last_date: one('SELECT MAX(document_date) AS d FROM source_documents').d,
    open_review_notes: one("SELECT COUNT(*) AS n FROM review_notes WHERE status = 'open'").n,
  };
}
