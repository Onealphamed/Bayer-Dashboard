import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateHost } from '../lib/netguard.js';

/* What /api/status actually passes: the WHATWG-parsed hostname of the stored URL. */
const hostOf = (u) => new URL(u).hostname;

describe('lib/netguard.js isPrivateHost', () => {
  it('blocks empty and missing hosts', () => {
    for (const h of ['', null, undefined, '.']) assert.equal(isPrivateHost(h), true, String(h));
  });

  it('blocks localhost and internal-only names (any case, trailing dot)', () => {
    for (const h of [
      'localhost', 'LOCALHOST', 'localhost.', 'api.localhost', 'printer.local', 'NAS.LOCAL',
      'metadata.google.internal', 'svc.internal', 'router.lan', 'nas.home.arpa',
    ]) {
      assert.equal(isPrivateHost(h), true, h);
    }
  });

  it('blocks private, loopback, link-local, CGNAT, unspecified, multicast and reserved IPv4', () => {
    for (const h of [
      '127.0.0.1', '127.255.255.254', '10.0.0.1', '10.255.255.255', '172.16.0.1', '172.31.255.255',
      '192.168.0.1', '192.168.255.255', '169.254.169.254', '169.254.0.1', '100.64.0.1', '100.127.255.255',
      '0.0.0.0', '0.1.2.3', '224.0.0.1', '239.255.255.250', '240.0.0.1', '255.255.255.255',
    ]) {
      assert.equal(isPrivateHost(h), true, h);
    }
  });

  it('allows public IPv4 just outside the private ranges', () => {
    for (const h of [
      '8.8.8.8', '1.1.1.1', '172.15.255.255', '172.32.0.1', '192.167.1.1', '192.169.0.1',
      '100.63.255.255', '100.128.0.1', '169.253.1.1', '11.0.0.1', '223.255.255.255', '9.255.255.255',
    ]) {
      assert.equal(isPrivateHost(h), false, h);
    }
  });

  it('blocks integer, hex, octal and short IPv4 spellings', () => {
    for (const h of ['2130706433', '0x7f000001', '0x7f.1', '127.1', '127.0.1', '017700000001',
      '10.0x0.0.1', '999.1.1.1', '1.2.3.4.5']) {
      assert.equal(isPrivateHost(h), true, h);
    }
  });

  it('blocks the same spellings after URL parsing (they normalise to dotted quads)', () => {
    for (const u of ['http://2130706433/', 'http://0x7f.1/', 'http://017700000001/', 'http://127.1/',
      'http://0x0a.0.0.1/', 'http://0177.0.0.1/', 'http://[::1]/', 'http://[0:0:0:0:0:0:0:1]/', 'http://LOCALHOST./']) {
      assert.equal(isPrivateHost(hostOf(u)), true, u + ' -> ' + hostOf(u));
    }
  });

  it('blocks IPv6 loopback, unspecified, unique-local and link-local', () => {
    for (const h of [
      '::1', '[::1]', '::', '[::]', 'fc00::1', '[fc00::1]', 'fd12:3456:789a::1', '[fdff::1]',
      'fe80::1', '[fe80::1%25eth0]', 'febf::1', 'FE80::ABCD',
    ]) {
      assert.equal(isPrivateHost(h), true, h);
    }
  });

  it('allows public IPv6', () => {
    for (const h of ['2606:4700:4700::1111', '[2001:4860:4860::8888]', '2a00:1450::1', '2001:db8::1']) {
      assert.equal(isPrivateHost(h), false, h);
    }
  });

  it('blocks IPv4-mapped IPv6 written with a dotted quad', () => {
    for (const h of ['::ffff:127.0.0.1', '[::ffff:10.0.0.1]', '::ffff:169.254.169.254', '::ffff:192.168.1.1', '::ffff:999.0.0.1']) {
      assert.equal(isPrivateHost(h), true, h);
    }
    assert.equal(isPrivateHost('::ffff:8.8.8.8'), false);
  });

  it('blocks IPv4-mapped IPv6 as the URL parser actually presents it (hex form)', () => {
    // new URL('http://[::ffff:127.0.0.1]/').hostname === '[::ffff:7f00:1]'. The
    // status endpoint passes this normalised form, so the guard has to catch it
    // or any loopback / metadata address is reachable through it.
    for (const u of [
      'http://[::ffff:127.0.0.1]/', 'http://[::ffff:10.0.0.1]/', 'http://[::ffff:169.254.169.254]/latest/meta-data/',
      'http://[::ffff:192.168.1.1]/', 'http://[::ffff:7f00:1]/',
    ]) {
      assert.equal(isPrivateHost(hostOf(u)), true, u + ' -> ' + hostOf(u));
    }
    assert.equal(isPrivateHost(hostOf('http://[::ffff:8.8.8.8]/')), false);
  });

  it('allows ordinary public host names', () => {
    for (const h of ['example.com', 'seo-tracker.vercel.app', 'localhost.example.com', 'local.example.com',
      'internal.example.com', 'my-lan.com', 'a.b.c.d.example', '127.0.0.1.example.com']) {
      assert.equal(isPrivateHost(h), false, h);
    }
  });
});
