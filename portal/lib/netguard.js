/*
 * Refuses health checks against loopback, link-local and private networks so
 * the status endpoint cannot be used to probe infrastructure. Applied to the
 * literal host; the portal only ever checks URLs an admin saved.
 */

function ipv4Parts(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  return p.every((n) => n >= 0 && n <= 255) ? p : null;
}

function privateV4([a, b]) {
  return a === 0 || a === 10 || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || a >= 224;
}

export function isPrivateHost(hostname) {
  let h = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')
    || h.endsWith('.internal') || h.endsWith('.lan') || h.endsWith('.home.arpa')) return true;

  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
  if (h.includes(':')) {
    if (h === '::' || h === '::1') return true;
    if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;        // fc00::/7 unique local
    if (/^fe[89ab][0-9a-f]:/.test(h)) return true;        // fe80::/10 link local
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
    if (mapped) {
      const p = ipv4Parts(mapped[1]);
      return !p || privateV4(p);
    }
    return false;
  }
  // Integer / hex / octal host forms ("2130706433", "0x7f.1") are rejected outright.
  if (/^[0-9.]+$/.test(h) || /^0x/.test(h) || /\.0x/.test(h)) {
    const p = ipv4Parts(h);
    return !p || privateV4(p);
  }
  return false;
}
