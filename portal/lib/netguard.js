/*
 * Refuses health checks against loopback, link-local, private and other
 * special-purpose networks so /api/status cannot be used to probe
 * infrastructure (including cloud metadata at 169.254.169.254).
 *
 * Hosts are checked twice: the literal host from the URL (IPv4 in any form,
 * IPv6 in any form including IPv4-mapped/translated/NAT64/6to4 encodings,
 * which the WHATWG URL parser serialises in hex, e.g. [::ffff:7f00:1]), and
 * then every address the name resolves to.
 */

function privateV4([a, b]) {
  return a === 0 || a === 10 || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0)                // 192.0.0.0/24 IETF + 192.0.2.0/24 docs
    || (a === 198 && (b === 18 || b === 19)) // benchmarking
    || (a === 100 && b >= 64 && b <= 127)    // carrier-grade NAT
    || a >= 224;                             // multicast + reserved + broadcast
}

function ipv4Parts(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  return p.every((n) => n >= 0 && n <= 255) ? p : null;
}

/** Parses any textual IPv6 address into 8 16-bit words, or returns null. */
export function parseIPv6(input) {
  let h = String(input).toLowerCase();
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
  const zone = h.indexOf('%');
  if (zone >= 0) h = h.slice(0, zone);
  if (!h.includes(':')) return null;

  // An embedded dotted IPv4 tail becomes two words.
  const lastColon = h.lastIndexOf(':');
  const tail = h.slice(lastColon + 1);
  if (tail.includes('.')) {
    const p = ipv4Parts(tail);
    if (!p) return null;
    h = h.slice(0, lastColon + 1) + ((p[0] << 8) | p[1]).toString(16) + ':' + ((p[2] << 8) | p[3]).toString(16);
  }

  const halves = h.split('::');
  if (halves.length > 2) return null;
  const parse = (s) => (s === '' ? [] : s.split(':'));
  const head = parse(halves[0]);
  const rest = halves.length === 2 ? parse(halves[1]) : [];
  if (halves.length === 1 && head.length !== 8) return null;
  if (halves.length === 2 && head.length + rest.length > 7) return null;
  const words = [];
  for (const part of head.concat(halves.length === 2 ? new Array(8 - head.length - rest.length).fill('0') : [], rest)) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
    words.push(parseInt(part, 16));
  }
  return words.length === 8 ? words : null;
}

function v4From(hi, lo) {
  return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff];
}

function privateV6(w) {
  const zero = (from, to) => w.slice(from, to).every((x) => x === 0);
  if (zero(0, 8)) return true;                                   // ::  unspecified
  if (zero(0, 7) && w[7] === 1) return true;                     // ::1 loopback
  if (zero(0, 5) && w[5] === 0xffff) return privateV4(v4From(w[6], w[7]));   // ::ffff:a.b.c.d mapped
  if (zero(0, 4) && w[4] === 0xffff && w[5] === 0) return privateV4(v4From(w[6], w[7])); // ::ffff:0:a.b.c.d translated
  if (zero(0, 6)) return true;                                   // ::a.b.c.d IPv4-compatible (deprecated)
  if (w[0] === 0x64 && w[1] === 0xff9b) {                        // NAT64 64:ff9b::/96 and local-use /48
    return !zero(2, 6) || privateV4(v4From(w[6], w[7]));
  }
  if (w[0] === 0x2002) return privateV4(v4From(w[1], w[2]));    // 6to4 embeds an IPv4
  if (w[0] === 0x2001 && w[1] === 0) return true;                // Teredo
  if (w[0] === 0x2001 && w[1] === 0xdb8) return true;            // documentation
  if (w[0] === 0x100 && zero(1, 4)) return true;                 // discard-only 100::/64
  if ((w[0] & 0xfe00) === 0xfc00) return true;                   // fc00::/7 unique local
  if ((w[0] & 0xffc0) === 0xfe80) return true;                   // fe80::/10 link local
  if ((w[0] & 0xffc0) === 0xfec0) return true;                   // fec0::/10 site local (deprecated)
  if ((w[0] & 0xff00) === 0xff00) return true;                   // ff00::/8 multicast
  return false;
}

/** True for any host that must not be contacted by the health checker. */
export function isPrivateHost(hostname) {
  let h = String(hostname || '').trim().toLowerCase().replace(/\.$/, '');
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')
    || h.endsWith('.internal') || h.endsWith('.lan') || h.endsWith('.home.arpa')
    || h.endsWith('.intranet') || h.endsWith('.corp')) return true;

  if (h.startsWith('[') || h.includes(':')) {
    const words = parseIPv6(h);
    return words ? privateV6(words) : true; // unparseable IPv6-looking host: refuse
  }
  // Numeric host forms the URL parser would normally canonicalise
  // ("2130706433", "0x7f.1", "0177.0.0.1"): anything that is not plain dotted
  // decimal is refused outright.
  if (/^[0-9.]+$/.test(h) || /(^|\.)0x/.test(h)) {
    const p = ipv4Parts(h);
    return !p || privateV4(p);
  }
  return false;
}

/** True when the address string returned by DNS is in a refused range. */
export function isPrivateAddress(address) {
  const p = ipv4Parts(address);
  if (p) return privateV4(p);
  const w = parseIPv6(address);
  return w ? privateV6(w) : true;
}

/**
 * Resolves the host and refuses it if ANY returned address is private. The
 * literal-host check alone cannot stop a public name that points inward.
 * Returns { ok: true } or { ok: false, reason }.
 */
export async function checkResolvedHost(hostname) {
  const h = String(hostname || '').replace(/^\[|\]$/g, '');
  if (ipv4Parts(h) || parseIPv6(h)) return { ok: true }; // literal already checked
  let dns;
  try {
    dns = await import('node:dns/promises');
  } catch {
    return { ok: true }; // no resolver in this runtime; literal check still applied
  }
  let records;
  try {
    records = await dns.lookup(h, { all: true, verbatim: true });
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
  if (!records.length) return { ok: false, reason: 'unreachable' };
  if (records.some((r) => isPrivateAddress(r.address))) {
    return { ok: false, reason: 'private address not checked' };
  }
  return { ok: true };
}
