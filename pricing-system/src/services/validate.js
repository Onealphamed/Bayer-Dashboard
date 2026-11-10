export class ValidationError extends Error {
  constructor(errors, status = 400) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join('; '));
    this.errors = errors;
    this.status = status;
  }
}

export const RATE_TYPES = ['actual', 'internal_cost', 'estimated', 'pass_through'];
export const PRICING_BASES = ['fixed', 'percent', 'at_actuals', 'quoted_separately'];
export const DOC_STATUSES = ['proposal', 'accepted', 'rejected', 'invoice', 'rate_card', 'other'];
export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'];
export const RATE_SOURCES = ['latest_actual', 'median_actual', 'recommended', 'manual', 'pass_through_actuals'];

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function isIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Small collector so every problem in a payload is reported at once. */
export class Checker {
  constructor() { this.errors = []; }
  add(field, message) { this.errors.push({ field, message }); }
  text(obj, field, { required = false, max = 2000 } = {}) {
    const v = obj[field];
    if (v == null || String(v).trim() === '') {
      if (required) this.add(field, 'is required');
      return null;
    }
    const s = String(v).trim();
    if (s.length > max) this.add(field, `must be at most ${max} characters`);
    return s;
  }
  number(obj, field, { required = false, min = null, max = null, gt = null } = {}) {
    const v = obj[field];
    if (v == null || v === '') {
      if (required) this.add(field, 'is required');
      return null;
    }
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    if (!Number.isFinite(n)) { this.add(field, 'must be a number'); return null; }
    if (min != null && n < min) this.add(field, `must be ≥ ${min}`);
    if (max != null && n > max) this.add(field, `must be ≤ ${max}`);
    if (gt != null && !(n > gt)) this.add(field, `must be > ${gt}`);
    return n;
  }
  oneOf(obj, field, list, { required = false, fallback = null } = {}) {
    const v = obj[field];
    if (v == null || v === '') {
      if (required && fallback == null) this.add(field, 'is required');
      return fallback;
    }
    if (!list.includes(v)) { this.add(field, `must be one of: ${list.join(', ')}`); return null; }
    return v;
  }
  date(obj, field, { required = false, fallback = null } = {}) {
    const v = obj[field];
    if (v == null || v === '') {
      if (required && fallback == null) this.add(field, 'is required');
      return fallback;
    }
    if (!isIsoDate(v)) { this.add(field, 'must be a valid date (YYYY-MM-DD)'); return null; }
    return v;
  }
  done() { if (this.errors.length) throw new ValidationError(this.errors); }
}

/** Normalise a product/service name for duplicate detection. */
const STOP = new Set(['and', 'the', 'of', 'for', 'with', 'per', 'a', 'an', 'incl', 'including', 'on', 'to', 'in', 'from', 'by']);
export function nameTokens(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t));
}
export function normaliseName(name) { return nameTokens(name).join(' '); }
export function similarity(a, b) {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}
