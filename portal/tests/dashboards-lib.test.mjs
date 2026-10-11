import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isEncrypted, vaultEncrypt } from '../lib/crypto.js';
import {
  COLORS, normalizeDashboard, openPassword, parseSeed, publicView, sealPassword, sortDashboards, validUrl,
} from '../lib/dashboards.js';
import { HttpError } from '../lib/http.js';
import { toSeedEntries, toSeedJson } from '../lib/seedjson.js';

const ok = (extra = {}) => ({ name: 'Sales', url: 'https://sales.example.com', ...extra });

function rejects400(fn, field, label) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof HttpError, `${label}: expected HttpError, got ${err}`);
    assert.equal(err.status, 400, label);
    if (field !== undefined) assert.equal(err.extra && err.extra.field, field, label);
    return true;
  }, label);
}

describe('lib/dashboards.js', () => {
  describe('normalizeDashboard: required fields and types', () => {
    it('builds a complete record from minimal input', () => {
      const r = normalizeDashboard(ok());
      assert.equal(r.name, 'Sales');
      assert.equal(r.url, 'https://sales.example.com/');
      assert.match(r.id, /^[A-Za-z0-9_-]{16}$/);
      assert.deepEqual(r.links, []);
      assert.equal(r.password, '');
      assert.equal(r.username, '');
      assert.equal(r.description, '');
      assert.equal(r.category, '');
      assert.equal(r.notes, '');
      assert.ok(COLORS.includes(r.color));
      assert.equal(r.order, 0);
      assert.ok(!Number.isNaN(Date.parse(r.createdAt)));
      assert.equal(r.createdAt, r.updatedAt);
    });

    it('rejects missing or non-object input', () => {
      for (const bad of [null, undefined, 'x', 42, [], [ok()]]) {
        rejects400(() => normalizeDashboard(bad), undefined, JSON.stringify(bad));
      }
    });

    it('requires a name and a URL', () => {
      rejects400(() => normalizeDashboard({ url: 'https://a.example' }), 'Name', 'no name');
      rejects400(() => normalizeDashboard(ok({ name: '   ' })), 'Name', 'blank name');
      rejects400(() => normalizeDashboard({ name: 'A' }), 'URL', 'no url');
      rejects400(() => normalizeDashboard(ok({ url: '  ' })), 'URL', 'blank url');
    });

    it('rejects non-text fields', () => {
      rejects400(() => normalizeDashboard(ok({ name: 5 })), 'Name', 'numeric name');
      rejects400(() => normalizeDashboard(ok({ name: ['a'] })), 'Name', 'array name');
      rejects400(() => normalizeDashboard(ok({ url: { href: 'https://x' } })), 'URL', 'object url');
      rejects400(() => normalizeDashboard(ok({ description: 1 })), 'Description', 'description');
      rejects400(() => normalizeDashboard(ok({ username: true })), 'Username', 'username');
      rejects400(() => normalizeDashboard(ok({ notes: {} })), 'Notes', 'notes');
      rejects400(() => normalizeDashboard(ok({ category: 3 })), 'Category', 'category');
      rejects400(() => normalizeDashboard(ok({ password: 1234 })), 'password', 'password');
    });

    it('trims text fields', () => {
      const r = normalizeDashboard(ok({ name: '  Sales  ', username: ' bob ', notes: ' n ', category: ' C ' }));
      assert.deepEqual([r.name, r.username, r.notes, r.category], ['Sales', 'bob', 'n', 'C']);
    });

    it('treats null optional fields as empty', () => {
      const r = normalizeDashboard(ok({ description: null, username: null, notes: null, links: null }));
      assert.deepEqual([r.description, r.username, r.notes, r.links], ['', '', '', []]);
    });
  });

  describe('normalizeDashboard: URLs', () => {
    it('accepts http and https and normalises the URL', () => {
      assert.equal(normalizeDashboard(ok({ url: 'https://Sales.Example.com' })).url, 'https://sales.example.com/');
      assert.equal(normalizeDashboard(ok({ url: 'http://a.example:8080/x?y=1#z' })).url, 'http://a.example:8080/x?y=1#z');
      assert.equal(normalizeDashboard(ok({ url: '  https://a.example/path  ' })).url, 'https://a.example/path');
    });

    it('rejects script and data URLs and other schemes', () => {
      for (const bad of [
        'javascript:alert(1)', 'JavaScript:alert(document.cookie)', ' javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>', 'data:text/html;base64,PHNjcmlwdD4=',
        'vbscript:msgbox(1)', 'file:///etc/passwd', 'ftp://files.example.com', 'blob:https://a.example/1',
        'mailto:a@b.c', 'about:blank',
      ]) {
        rejects400(() => normalizeDashboard(ok({ url: bad })), 'URL', bad);
      }
    });

    it('rejects relative and malformed URLs', () => {
      for (const bad of ['/dashboard', '//example.com', 'https://', 'http://exa mple.com', 'https://[::1',
        'localhost', 'dashboard', 'example', 'example.com@evil.com', 'exa mple.com', '.example.com']) {
        rejects400(() => normalizeDashboard(ok({ url: bad })), 'URL', bad);
      }
    });

    it('reads a bare host name as https:// (a common way to paste a Vercel URL)', () => {
      const cases = {
        'example.com': 'https://example.com/',
        'howrah-bridge-pmo-alpha.vercel.app': 'https://howrah-bridge-pmo-alpha.vercel.app/',
        'seo.example.co.uk/admin?x=1': 'https://seo.example.co.uk/admin?x=1',
        'x.example.com:8443/path': 'https://x.example.com:8443/path',
      };
      for (const [input, want] of Object.entries(cases)) {
        assert.equal(normalizeDashboard(ok({ url: input })).url, want, input);
      }
      // Never turns a dangerous scheme into a link.
      for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'mailto:a@b.example']) {
        rejects400(() => normalizeDashboard(ok({ url: bad })), 'URL', bad);
      }
    });

    it('rejects credentials embedded in the URL', () => {
      for (const bad of ['https://user:pass@a.example', 'https://user@a.example', 'https://:pass@a.example/x']) {
        rejects400(() => normalizeDashboard(ok({ url: bad })), 'URL', bad);
      }
    });

    it('enforces the 2048-character limit', () => {
      const base = 'https://a.example/';
      assert.ok(normalizeDashboard(ok({ url: base + 'x'.repeat(2048 - base.length) })));
      rejects400(() => normalizeDashboard(ok({ url: base + 'x'.repeat(2049 - base.length) })), 'URL', 'long url');
    });

    it('validUrl returns "" for an optional empty value', () => {
      assert.equal(validUrl('', 'Link'), '');
      assert.equal(validUrl(undefined, 'Link'), '');
    });
  });

  describe('normalizeDashboard: length limits', () => {
    const limits = { name: ['Name', 80], description: ['Description', 300], category: ['Category', 40],
      username: ['Username', 200], notes: ['Notes', 1000] };
    for (const [key, [field, max]] of Object.entries(limits)) {
      it(`${key}: ${max} allowed, ${max + 1} rejected`, () => {
        assert.equal(normalizeDashboard(ok({ [key]: 'a'.repeat(max) }))[key].length, max);
        rejects400(() => normalizeDashboard(ok({ [key]: 'a'.repeat(max + 1) })), field, key);
      });
    }

    it('password: 500 allowed, 501 rejected', () => {
      assert.equal(normalizeDashboard(ok({ password: 'p'.repeat(500) })).password.length, 500);
      rejects400(() => normalizeDashboard(ok({ password: 'p'.repeat(501) })), 'password', 'long password');
    });

    it('the limit applies after trimming', () => {
      assert.equal(normalizeDashboard(ok({ name: '  ' + 'a'.repeat(80) + '  ' })).name.length, 80);
    });
  });

  describe('normalizeDashboard: links', () => {
    it('keeps valid links and defaults the label', () => {
      const r = normalizeDashboard(ok({
        links: [{ label: 'Admin', url: 'https://a.example/admin' }, { url: 'https://a.example/docs' }],
      }));
      assert.deepEqual(r.links, [
        { label: 'Admin', url: 'https://a.example/admin' },
        { label: 'Link', url: 'https://a.example/docs' },
      ]);
    });

    it('skips empty rows and non-objects', () => {
      const r = normalizeDashboard(ok({
        links: [null, 'x', 5, {}, { label: '', url: '' }, { label: '  ', url: '  ' }, { label: 'K', url: 'https://k.example' }],
      }));
      assert.deepEqual(r.links, [{ label: 'K', url: 'https://k.example/' }]);
    });

    it('must be a list', () => {
      for (const bad of ['https://a.example', { label: 'x', url: 'https://a.example' }, 5]) {
        rejects400(() => normalizeDashboard(ok({ links: bad })), 'links', JSON.stringify(bad));
      }
    });

    it('a label without a URL is an error', () => {
      rejects400(() => normalizeDashboard(ok({ links: [{ label: 'Docs' }] })), 'links', 'label only');
    });

    it('link URLs get the same scheme and credential checks', () => {
      for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'https://u:p@a.example', 'not a url']) {
        rejects400(() => normalizeDashboard(ok({ links: [{ label: 'x', url: bad }] })), 'Link 1 URL', bad);
      }
      rejects400(() => normalizeDashboard(ok({ links: [{ label: 'ok', url: 'https://a.example' }, { label: 'x', url: 'javascript:1' }] })),
        'Link 2 URL', 'second link');
    });

    it('link labels are limited to 40 characters', () => {
      assert.ok(normalizeDashboard(ok({ links: [{ label: 'l'.repeat(40), url: 'https://a.example' }] })));
      rejects400(() => normalizeDashboard(ok({ links: [{ label: 'l'.repeat(41), url: 'https://a.example' }] })), 'Link 1 label', 'label');
    });

    it('at most 8 links', () => {
      const mk = (n) => Array.from({ length: n }, (_, i) => ({ label: 'L' + i, url: `https://a.example/${i}` }));
      assert.equal(normalizeDashboard(ok({ links: mk(8) })).links.length, 8);
      rejects400(() => normalizeDashboard(ok({ links: mk(9) })), 'links', '9 links');
    });

    it('on update, omitted links are kept and an empty list clears them', () => {
      const existing = normalizeDashboard(ok({ links: [{ label: 'A', url: 'https://a.example' }] }));
      assert.deepEqual(normalizeDashboard(ok(), existing).links, existing.links);
      assert.deepEqual(normalizeDashboard(ok({ links: [] }), existing).links, []);
      assert.deepEqual(normalizeDashboard(ok({ links: null }), existing).links, []);
    });
  });

  describe('normalizeDashboard: password semantics', () => {
    it('new record: omitted password is empty; given password is kept verbatim (not trimmed)', () => {
      assert.equal(normalizeDashboard(ok()).password, '');
      assert.equal(normalizeDashboard(ok({ password: '  pw with spaces  ' })).password, '  pw with spaces  ');
    });

    it('update: omitted password keeps the stored one', () => {
      const existing = normalizeDashboard(ok({ password: 'old-pw' }));
      assert.equal(normalizeDashboard(ok({ name: 'Renamed' }), existing).password, 'old-pw');
    });

    it('update: an empty string clears it; a new value replaces it', () => {
      const existing = normalizeDashboard(ok({ password: 'old-pw' }));
      assert.equal(normalizeDashboard(ok({ password: '' }), existing).password, '');
      assert.equal(normalizeDashboard(ok({ password: 'new-pw' }), existing).password, 'new-pw');
    });

    it('update: null is not a valid way to clear (must be text)', () => {
      const existing = normalizeDashboard(ok({ password: 'old-pw' }));
      rejects400(() => normalizeDashboard(ok({ password: null }), existing), 'password', 'null');
    });
  });

  describe('normalizeDashboard: identity, colour and timestamps', () => {
    it('update keeps id, order, createdAt and colour; refreshes updatedAt', async () => {
      const existing = { ...normalizeDashboard(ok({ color: 'teal' })), order: 7, createdAt: '2020-01-01T00:00:00.000Z' };
      await new Promise((r) => setTimeout(r, 5));
      const r = normalizeDashboard(ok({ name: 'New name', id: 'attacker-chosen', color: 'not-a-color' }), existing);
      assert.equal(r.id, existing.id);
      assert.equal(r.order, 7);
      assert.equal(r.createdAt, '2020-01-01T00:00:00.000Z');
      assert.equal(r.color, 'teal');
      assert.ok(r.updatedAt > existing.updatedAt);
    });

    it('a new record never takes an id from the input', () => {
      assert.notEqual(normalizeDashboard(ok({ id: 'chosen' })).id, 'chosen');
    });

    it('idOverride wins', () => {
      const existing = normalizeDashboard(ok());
      assert.equal(normalizeDashboard(ok(), existing, { idOverride: 'forced' }).id, 'forced');
    });

    it('accepts a palette colour and derives a stable one otherwise', () => {
      assert.equal(normalizeDashboard(ok({ color: 'rose' })).color, 'rose');
      const a = normalizeDashboard(ok({ name: 'Stable', color: '#ff0000' })).color;
      const b = normalizeDashboard(ok({ name: 'Stable' })).color;
      assert.equal(a, b);
      assert.ok(COLORS.includes(a));
    });

    it('drops unknown fields and ignores __proto__ keys from parsed JSON', () => {
      const body = JSON.parse('{"name":"Sales","url":"https://sales.example.com","isAdmin":true,'
        + '"__proto__":{"polluted":1},"extra":"x","hasPassword":true,"createdAt":"1999-01-01T00:00:00.000Z"}');
      const r = normalizeDashboard(body);
      assert.notEqual(r.createdAt, '1999-01-01T00:00:00.000Z', 'createdAt is server-controlled');
      assert.equal(r.isAdmin, undefined);
      assert.equal(r.extra, undefined);
      assert.equal(r.hasPassword, undefined);
      assert.equal(({}).polluted, undefined);
    });
  });

  describe('publicView', () => {
    it('removes the password and reports whether one exists', () => {
      const rec = normalizeDashboard(ok({ password: 'secret-pw', username: 'u' }));
      const v = publicView(rec);
      assert.equal('password' in v, false);
      assert.equal(v.hasPassword, true);
      assert.equal(v.username, 'u');
      assert.ok(!JSON.stringify(v).includes('secret-pw'));
      assert.equal(rec.password, 'secret-pw', 'original record untouched');
      assert.equal(publicView(normalizeDashboard(ok())).hasPassword, false);
    });

    it('also hides encrypted passwords', async () => {
      const sealed = await sealPassword(normalizeDashboard(ok({ password: 'pw' })), 'k');
      const v = publicView(sealed);
      assert.equal('password' in v, false);
      assert.ok(!JSON.stringify(v).includes('enc:v1:'));
    });
  });

  describe('sealPassword / openPassword', () => {
    it('encrypts with VAULT_KEY and decrypts back', async () => {
      const rec = normalizeDashboard(ok({ password: 'pw-123' }));
      const sealed = await sealPassword(rec, 'vault');
      assert.ok(isEncrypted(sealed.password));
      assert.equal(rec.password, 'pw-123', 'does not mutate');
      assert.equal(await openPassword(sealed, 'vault'), 'pw-123');
    });

    it('does not double-encrypt and leaves empty passwords alone', async () => {
      const sealed = await sealPassword(normalizeDashboard(ok({ password: 'pw' })), 'vault');
      assert.equal((await sealPassword(sealed, 'vault')).password, sealed.password);
      assert.equal((await sealPassword(normalizeDashboard(ok()), 'vault')).password, '');
    });

    it('stores plaintext when no VAULT_KEY is set', async () => {
      const rec = normalizeDashboard(ok({ password: 'pw' }));
      assert.equal((await sealPassword(rec, null)).password, 'pw');
      assert.equal(await openPassword(rec, null), 'pw');
      assert.equal(await openPassword(rec, 'any'), 'pw');
      assert.equal(await openPassword(normalizeDashboard(ok()), 'any'), '');
    });

    it('explains a missing or changed VAULT_KEY with a 500', async () => {
      const sealed = { password: await vaultEncrypt('vault', 'pw') };
      await assert.rejects(openPassword(sealed, null), (e) => e instanceof HttpError && e.status === 500 && /VAULT_KEY is not set/.test(e.message));
      await assert.rejects(openPassword(sealed, 'other'), (e) => e instanceof HttpError && e.status === 500 && /VAULT_KEY may have changed/.test(e.message));
    });
  });

  describe('parseSeed', () => {
    it('handles empty, invalid and non-array input', async () => {
      // Empty / absent is a valid "no dashboards"; unreadable input is FATAL so
      // storage is never seeded with an empty list by mistake.
      assert.deepEqual(await parseSeed(''), { items: [], errors: [], fatal: false });
      assert.deepEqual(await parseSeed('   '), { items: [], errors: [], fatal: false });
      assert.deepEqual(await parseSeed(undefined), { items: [], errors: [], fatal: false });
      assert.deepEqual(await parseSeed('[]'), { items: [], errors: [], fatal: false });
      for (const [input, re] of [['{oops', /not valid JSON/], ['{"name":"x"}', /must be a JSON array/], ['null', /must be a JSON array/]]) {
        const r = await parseSeed(input);
        assert.equal(r.fatal, true, input);
        assert.deepEqual(r.items, [], input);
        assert.equal(r.errors.length, 1, input);
        assert.match(r.errors[0], re, input);
      }
    });

    it('derives the same id whether or not the URL has a trailing slash', async () => {
      const a = await parseSeed(JSON.stringify([{ name: 'D', url: 'https://dup.example.com' }]));
      const b = await parseSeed(JSON.stringify([{ name: 'D', url: 'https://dup.example.com/' }]));
      assert.equal(a.items[0].id, b.items[0].id);
    });

    it('never lets an explicit id shadow an Object.prototype property', async () => {
      const r = await parseSeed(JSON.stringify(['__proto__', 'constructor', 'toString', 'valueOf', 'ok-id']
        .map((id) => ({ id, name: id, url: 'https://x.example/' + id }))));
      const ids = r.items.map((d) => d.id);
      for (const bad of ['__proto__', 'constructor', 'toString', 'valueOf']) assert.ok(!ids.includes(bad), bad);
      assert.ok(ids.includes('ok-id'));
    });

    it('derives ids from content so they are stable between calls', async () => {
      const seed = JSON.stringify([ok(), { name: 'Ops', url: 'https://ops.example.com' }]);
      const a = await parseSeed(seed);
      const b = await parseSeed(seed);
      assert.deepEqual(a.items.map((d) => d.id), b.items.map((d) => d.id));
      assert.equal(new Set(a.items.map((d) => d.id)).size, 2);
      for (const d of a.items) assert.match(d.id, /^s[A-Za-z0-9_-]{11}$/);
      // Changing other fields (e.g. the password) keeps the id; changing name or URL changes it.
      const pwChanged = await parseSeed(JSON.stringify([ok({ password: 'x', notes: 'n' })]));
      assert.equal(pwChanged.items[0].id, a.items[0].id);
      const renamed = await parseSeed(JSON.stringify([ok({ name: 'Sales 2' })]));
      assert.notEqual(renamed.items[0].id, a.items[0].id);
    });

    it('uses a valid explicit id and ignores an invalid one', async () => {
      const r = await parseSeed(JSON.stringify([
        ok({ id: 'my-id_1' }), ok({ name: 'B', id: 'has space' }), ok({ name: 'C', id: 'x'.repeat(41) }), ok({ name: 'D', id: 42 }),
      ]));
      assert.equal(r.items[0].id, 'my-id_1');
      for (const d of r.items.slice(1)) assert.match(d.id, /^s/);
    });

    it('de-duplicates colliding ids', async () => {
      const r = await parseSeed(JSON.stringify([ok(), ok(), ok({ id: 'dup' }), ok({ id: 'dup' })]));
      const ids = r.items.map((d) => d.id);
      assert.equal(new Set(ids).size, 4);
      assert.equal(ids[1], ids[0] + '_');
      assert.deepEqual(ids.slice(2), ['dup', 'dup_']);
    });

    it('keeps good entries and reports bad ones with a 1-based index', async () => {
      const r = await parseSeed(JSON.stringify([
        ok(), { name: 'No URL' }, null, ok({ name: 'Evil', url: 'javascript:alert(1)' }), ok({ name: 'Last' }),
      ]));
      assert.deepEqual(r.items.map((d) => d.name), ['Sales', 'Last']);
      assert.equal(r.errors.length, 3);
      assert.match(r.errors[0], /^DASHBOARDS entry 2: URL is required/);
      assert.match(r.errors[1], /^DASHBOARDS entry 3: /);
      assert.match(r.errors[2], /^DASHBOARDS entry 4: URL must start with https/);
    });

    it('orders by position and uses a fixed timestamp', async () => {
      const r = await parseSeed(JSON.stringify([ok({ name: 'Z' }), ok({ name: 'A' })]));
      assert.deepEqual(r.items.map((d) => [d.name, d.order]), [['Z', 0], ['A', 1]]);
      for (const d of r.items) {
        assert.equal(d.createdAt, '1970-01-01T00:00:00.000Z');
        assert.equal(d.updatedAt, '1970-01-01T00:00:00.000Z');
      }
    });

    it('keeps seed passwords (plaintext) for later sealing', async () => {
      const r = await parseSeed(JSON.stringify([ok({ password: 'seed-pw' })]));
      assert.equal(r.items[0].password, 'seed-pw');
    });
  });

  describe('sortDashboards', () => {
    it('sorts by order, then name, without mutating', () => {
      const items = [{ name: 'b', order: 1 }, { name: 'a', order: 1 }, { name: 'z', order: 0 }];
      assert.deepEqual(sortDashboards(items).map((d) => d.name), ['z', 'a', 'b']);
      assert.deepEqual(items.map((d) => d.name), ['b', 'a', 'z']);
    });
  });

  describe('seedjson', () => {
    it('round-trips through parseSeed and omits empty fields', async () => {
      const rec = normalizeDashboard(ok({
        description: 'd', category: 'c', color: 'teal', username: 'u', password: 'p', notes: 'n',
        links: [{ label: 'L', url: 'https://l.example' }],
      }));
      const bare = normalizeDashboard({ name: 'Bare', url: 'https://bare.example' });
      const { entries, unreadable } = await toSeedEntries([rec, bare], null);
      assert.deepEqual(unreadable, []);
      assert.deepEqual(entries[0], {
        id: rec.id, name: 'Sales', url: 'https://sales.example.com/', description: 'd', category: 'c', color: 'teal',
        links: [{ label: 'L', url: 'https://l.example/' }], username: 'u', password: 'p', notes: 'n',
      });
      assert.deepEqual(Object.keys(entries[1]).sort(), ['color', 'id', 'name', 'url']);
      const { json: seedJson } = await toSeedJson([rec], null);
      const back = await parseSeed(seedJson);
      assert.equal(back.errors.length, 0);
      assert.equal(back.items[0].password, 'p');
      assert.equal(back.items[0].id, rec.id, 'ids survive the paste round trip');
    });

    it('decrypts sealed passwords and can leave secrets out', async () => {
      const sealed = await sealPassword(normalizeDashboard(ok({ password: 'p-1' })), 'vault');
      assert.equal((await toSeedEntries([sealed], 'vault')).entries[0].password, 'p-1');
      const noSecrets = (await toSeedEntries([sealed], 'vault', { includeSecrets: false })).entries;
      assert.equal('password' in noSecrets[0], false);
      assert.ok(!JSON.stringify(noSecrets).includes('enc:v1:'));
    });

    it('leaves out a password it cannot decrypt instead of failing the whole export', async () => {
      const good = await sealPassword(normalizeDashboard(ok({ name: 'Good', password: 'g' })), 'vault');
      const stale = await sealPassword(normalizeDashboard(ok({ name: 'Stale', password: 's' })), 'old-key');
      const { entries, unreadable } = await toSeedEntries([good, stale], 'vault');
      assert.equal(entries[0].password, 'g');
      assert.equal('password' in entries[1], false);
      assert.deepEqual(unreadable, ['Stale']);
    });

    it('round-trips a plaintext password that looks like ciphertext', async () => {
      const rec = normalizeDashboard(ok({ password: 'enc:v1:notreally' }));
      assert.equal(await openPassword(rec, null), 'enc:v1:notreally');
      assert.equal(await openPassword(await sealPassword(rec, 'vault'), 'vault'), 'enc:v1:notreally');
      const { json: seedJson } = await toSeedJson([rec], null);
      const back = await parseSeed(seedJson);
      assert.equal(await openPassword(back.items[0], null), 'enc:v1:notreally');
    });
  });
});
