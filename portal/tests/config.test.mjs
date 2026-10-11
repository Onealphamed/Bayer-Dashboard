import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { configWarnings, getConfig } from '../lib/config.js';
import { baseEnv, env } from './helpers/portal.mjs';

const codes = (cfg) => configWarnings(cfg).map((w) => w.code).sort();

describe('lib/config.js', () => {
  describe('users', () => {
    it('PORTAL_USERNAME + PORTAL_PASSWORD gives one admin', () => {
      const cfg = getConfig({ PORTAL_USERNAME: 'boss', PORTAL_PASSWORD: 'pw' });
      assert.deepEqual(cfg.users, [{ username: 'boss', password: 'pw', role: 'admin' }]);
    });

    it('trims the username but never the password', () => {
      const cfg = getConfig({ PORTAL_USERNAME: '  boss  ', PORTAL_PASSWORD: '  pw  ' });
      assert.deepEqual(cfg.users, [{ username: 'boss', password: '  pw  ', role: 'admin' }]);
    });

    it('needs both username and password', () => {
      assert.deepEqual(getConfig({ PORTAL_USERNAME: 'boss' }).users, []);
      assert.deepEqual(getConfig({ PORTAL_PASSWORD: 'pw' }).users, []);
      assert.deepEqual(getConfig({ PORTAL_USERNAME: '   ', PORTAL_PASSWORD: 'pw' }).users, []);
      assert.deepEqual(getConfig({}).users, []);
    });

    it('adds PORTAL_USERS with their roles', () => {
      const cfg = getConfig({
        PORTAL_USERNAME: 'boss', PORTAL_PASSWORD: 'pw',
        PORTAL_USERS: JSON.stringify([
          { username: 'v', password: 'vp', role: 'viewer' },
          { username: 'a2', password: 'ap', role: 'admin' },
          { username: 'norole', password: 'np' },
        ]),
      });
      assert.deepEqual(cfg.users.map((u) => [u.username, u.role]), [
        ['boss', 'admin'], ['v', 'viewer'], ['a2', 'admin'], ['norole', 'admin'],
      ]);
    });

    it('PORTAL_USERS works on its own without the primary login', () => {
      const cfg = getConfig({ PORTAL_USERS: '[{"username":"solo","password":"p","role":"viewer"}]' });
      assert.deepEqual(cfg.users, [{ username: 'solo', password: 'p', role: 'viewer' }]);
    });

    it('a malformed PORTAL_USERS never takes the primary login down', () => {
      for (const bad of ['{not json', '{"username":"x","password":"y"}', '"str"', 'null', '42', '']) {
        const cfg = getConfig({ PORTAL_USERNAME: 'boss', PORTAL_PASSWORD: 'pw', PORTAL_USERS: bad });
        assert.deepEqual(cfg.users.map((u) => u.username), ['boss'], bad);
      }
    });

    it('skips invalid entries inside PORTAL_USERS', () => {
      const cfg = getConfig({
        PORTAL_USERNAME: 'boss', PORTAL_PASSWORD: 'pw',
        PORTAL_USERS: JSON.stringify([
          null, 'x', 7, [], {}, { username: 'nopw' }, { password: 'nouser' },
          { username: '  ', password: 'blank' }, { username: 'ok', password: 'p', role: 'viewer' },
        ]),
      });
      assert.deepEqual(cfg.users.map((u) => u.username), ['boss', 'ok']);
    });

    it('duplicates (case-insensitive) keep the first; the primary login wins', () => {
      const cfg = getConfig({
        PORTAL_USERNAME: 'Boss', PORTAL_PASSWORD: 'pw',
        PORTAL_USERS: JSON.stringify([
          { username: 'boss', password: 'other', role: 'viewer' },
          { username: 'v', password: 'one', role: 'viewer' },
          { username: ' V ', password: 'two', role: 'admin' },
        ]),
      });
      assert.deepEqual(cfg.users, [
        { username: 'Boss', password: 'pw', role: 'admin' },
        { username: 'v', password: 'one', role: 'viewer' },
      ]);
    });

    it('an unrecognised role never grants admin (least privilege)', () => {
      // A typo such as "Viewer" or "read-only" must not silently hand out full
      // admin rights (edit, delete, export every stored password).
      for (const role of ['Viewer', 'VIEWER', 'read-only', 'readonly', 'guest', 'superuser']) {
        const cfg = getConfig({ PORTAL_USERS: JSON.stringify([{ username: 'u', password: 'p', role }]) });
        const u = cfg.users.find((x) => x.username === 'u');
        assert.ok(!u || u.role !== 'admin', `role ${JSON.stringify(role)} became ${u && u.role}`);
      }
    });

    it('coerces non-string usernames/passwords to text', () => {
      const cfg = getConfig({ PORTAL_USERS: JSON.stringify([{ username: 1234, password: 5678, role: 'viewer' }]) });
      assert.deepEqual(cfg.users, [{ username: '1234', password: '5678', role: 'viewer' }]);
    });
  });

  describe('redis', () => {
    it('is null without both URL and token', () => {
      assert.equal(getConfig({}).redis, null);
      assert.equal(getConfig({ KV_REST_API_URL: 'https://r.example' }).redis, null);
      assert.equal(getConfig({ KV_REST_API_TOKEN: 't' }).redis, null);
      assert.equal(getConfig({ UPSTASH_REDIS_REST_URL: 'https://r.example' }).redis, null);
    });

    it('accepts the Vercel KV_* names', () => {
      assert.deepEqual(getConfig({ KV_REST_API_URL: 'https://kv.example', KV_REST_API_TOKEN: 'kt' }).redis,
        { url: 'https://kv.example', token: 'kt' });
    });

    it('accepts the UPSTASH_REDIS_REST_* names', () => {
      assert.deepEqual(getConfig({ UPSTASH_REDIS_REST_URL: 'https://up.example', UPSTASH_REDIS_REST_TOKEN: 'ut' }).redis,
        { url: 'https://up.example', token: 'ut' });
    });

    it('prefers KV_* when both are present and allows mixing', () => {
      assert.deepEqual(getConfig({
        KV_REST_API_URL: 'https://kv.example', KV_REST_API_TOKEN: 'kt',
        UPSTASH_REDIS_REST_URL: 'https://up.example', UPSTASH_REDIS_REST_TOKEN: 'ut',
      }).redis, { url: 'https://kv.example', token: 'kt' });
      assert.deepEqual(getConfig({ KV_REST_API_URL: 'https://kv.example', UPSTASH_REDIS_REST_TOKEN: 'ut' }).redis,
        { url: 'https://kv.example', token: 'ut' });
    });

    it('strips trailing slashes from the URL', () => {
      assert.equal(getConfig({ KV_REST_API_URL: 'https://kv.example///', KV_REST_API_TOKEN: 't' }).redis.url,
        'https://kv.example');
    });
  });

  describe('other settings', () => {
    it('title defaults and is capped at 80 characters', () => {
      assert.equal(getConfig({}).title, 'Master Dashboard');
      assert.equal(getConfig({ PORTAL_TITLE: 'My Hub' }).title, 'My Hub');
      assert.equal(getConfig({ PORTAL_TITLE: 'x'.repeat(200) }).title.length, 80);
    });

    it('SESSION_TTL_HOURS defaults to 12 and is clamped to 1..720', () => {
      assert.equal(getConfig({}).sessionTtlHours, 12);
      assert.equal(getConfig({ SESSION_TTL_HOURS: 'abc' }).sessionTtlHours, 12);
      assert.equal(getConfig({ SESSION_TTL_HOURS: '0' }).sessionTtlHours, 1);
      assert.equal(getConfig({ SESSION_TTL_HOURS: '-5' }).sessionTtlHours, 1);
      assert.equal(getConfig({ SESSION_TTL_HOURS: '24' }).sessionTtlHours, 24);
      assert.equal(getConfig({ SESSION_TTL_HOURS: '99999' }).sessionTtlHours, 720);
    });

    it('secrets and seed pass through; missing secrets are null', () => {
      const cfg = getConfig({ SESSION_SECRET: 's', VAULT_KEY: 'v', DASHBOARDS: '[]' });
      assert.equal(cfg.sessionSecret, 's');
      assert.equal(cfg.vaultKey, 'v');
      assert.equal(cfg.seed, '[]');
      const empty = getConfig({});
      assert.equal(empty.sessionSecret, null);
      assert.equal(empty.vaultKey, null);
      assert.equal(empty.seed, '');
    });

    it('STATUS_ALLOW_PRIVATE is enabled only by exactly "1"', () => {
      assert.equal(getConfig({}).allowPrivateStatusTargets, false);
      assert.equal(getConfig({ STATUS_ALLOW_PRIVATE: '1' }).allowPrivateStatusTargets, true);
      for (const v of ['0', 'true', 'yes', '']) {
        assert.equal(getConfig({ STATUS_ALLOW_PRIVATE: v }).allowPrivateStatusTargets, false, v);
      }
    });

    it('reads process.env on every call', (t) => {
      env(t, { PORTAL_TITLE: 'First' });
      assert.equal(getConfig().title, 'First');
      process.env.PORTAL_TITLE = 'Second';
      assert.equal(getConfig().title, 'Second');
    });
  });

  describe('configWarnings', () => {
    it('reports every missing piece', () => {
      assert.deepEqual(codes(getConfig({})), ['no_session_secret', 'no_storage', 'no_users', 'no_vault_key']);
      const levels = Object.fromEntries(configWarnings(getConfig({})).map((w) => [w.code, w.level]));
      assert.deepEqual(levels, { no_users: 'error', no_session_secret: 'warn', no_vault_key: 'warn', no_storage: 'info' });
    });

    it('is empty for a complete configuration with storage', () => {
      assert.deepEqual(codes(getConfig(baseEnv({ KV_REST_API_URL: 'https://kv.example', KV_REST_API_TOKEN: 't', DASHBOARDS: '[]' }))), []);
    });

    it('flags a DASHBOARDS value that is not a JSON array', () => {
      for (const bad of ['{nope', '{"name":"x"}', '"x"', 'null', '1']) {
        assert.ok(codes(getConfig(baseEnv({ DASHBOARDS: bad }))).includes('bad_seed'), bad);
      }
      assert.ok(!codes(getConfig(baseEnv({ DASHBOARDS: '[]' }))).includes('bad_seed'));
      assert.ok(!codes(getConfig(baseEnv())).includes('bad_seed'));
    });

    it('never includes secret values', () => {
      const vars = baseEnv({ DASHBOARDS: '{"password":"seed-secret-xyz"' });
      delete vars.SESSION_SECRET;
      delete vars.VAULT_KEY;
      const text = JSON.stringify(configWarnings(getConfig(vars)));
      for (const secret of [vars.PORTAL_PASSWORD, 'Viewer-Pass-456', 'seed-secret-xyz']) {
        assert.ok(!text.includes(secret), secret);
      }
      assert.ok(configWarnings(getConfig(vars)).every((w) => typeof w.text === 'string' && w.text.length > 0));
    });
  });
});
