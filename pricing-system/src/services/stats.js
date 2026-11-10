import { round2 } from './validate.js';

/** Descriptive statistics over a list of numbers. Returns null for an empty list. */
export function describe(values) {
  const v = values.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  const n = v.length;
  if (!n) return null;
  const sum = v.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  const variance = n > 1 ? v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1) : 0;
  const stddev = Math.sqrt(variance);
  return {
    count: n,
    min: v[0],
    max: v[n - 1],
    mean: round2(mean),
    median: round2(median),
    stddev: round2(stddev),
    cv: mean ? round2(stddev / mean) : 0, // coefficient of variation
    spread_ratio: v[0] > 0 ? round2(v[n - 1] / v[0]) : null,
  };
}

/**
 * Recommend a future rate from ACTUAL historical observations only.
 * The result is always one of the observed values (latest) or their median — never extrapolated,
 * never inflated, and never produced when there is no data.
 *
 * @param {object} service   { pricing_basis }
 * @param {Array}  actuals   [{ unit_rate, effective_date, client, id }] current actual rates (one unit)
 * @param {Array}  costs     internal cost observations (optional)
 */
export function recommend(service, actuals, costs = []) {
  if (service.pricing_basis === 'quoted_separately') {
    return { status: 'no_price', recommended: null, confidence: null,
      rationale: 'Quoted separately in the source documents; no price on record. Enter a rate manually.' };
  }
  if (service.pricing_basis === 'at_actuals') {
    return { status: 'pass_through', recommended: null, confidence: null,
      rationale: 'Billed to the client at actuals. Enter the actual amount for each job.' };
  }
  if (!actuals.length) {
    return { status: 'no_data', recommended: null, confidence: null,
      rationale: 'No actual rate on record. The system does not suggest a rate without data.' };
  }
  const sorted = actuals.slice().sort((a, b) =>
    a.effective_date === b.effective_date ? a.id - b.id : a.effective_date < b.effective_date ? -1 : 1);
  const latest = sorted[sorted.length - 1];
  const s = describe(sorted.map((r) => r.unit_rate));
  const clients = new Set(sorted.map((r) => r.client).filter(Boolean));
  let recommended;
  let method;
  let confidence;
  const rationale = [];

  if (s.count === 1) {
    recommended = latest.unit_rate;
    method = 'single_observation';
    confidence = 'low';
    rationale.push(`Only one quoted rate on record (${latest.effective_date}${latest.client ? `, ${latest.client}` : ''}).`);
  } else if (s.cv <= 0.05) {
    recommended = latest.unit_rate;
    method = 'latest_consistent';
    confidence = s.count >= 3 && clients.size >= 2 ? 'high' : 'medium';
    rationale.push(`${s.count} quotes across ${clients.size} client(s) are consistent (variation ${Math.round(s.cv * 100)}%). Using the latest rate.`);
  } else {
    recommended = s.median;
    method = 'median';
    confidence = s.count >= 3 ? 'medium' : 'low';
    rationale.push(`${s.count} quotes vary from ${s.min} to ${s.max} (variation ${Math.round(s.cv * 100)}%). Using the median; review before quoting.`);
    const drift = s.median ? (latest.unit_rate - s.median) / s.median : 0;
    if (Math.abs(drift) > 0.15) rationale.push(`Latest quote (${latest.unit_rate}) is ${Math.round(drift * 100)}% from the median.`);
  }

  const warnings = [];
  const c = describe(costs.map((r) => r.unit_rate));
  let margin_pct = null;
  if (c) {
    margin_pct = recommended ? round2(((recommended - c.mean) / recommended) * 100) : null;
    if (recommended < c.max) warnings.push(`Recommended rate is below the highest recorded internal cost (${c.max}).`);
  }

  return {
    status: 'ok',
    recommended: round2(recommended),
    method,
    confidence,
    floor: s.min,
    ceiling: s.max,
    latest: { rate: latest.unit_rate, date: latest.effective_date, client: latest.client || null, rate_id: latest.id },
    observations: s.count,
    clients: clients.size,
    margin_pct,
    rationale: rationale.join(' '),
    warnings,
  };
}
