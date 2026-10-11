import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VAULT_PREFIX, b64urlDecode, b64urlEncode, fromUtf8, hmacSign, hmacVerify, isEncrypted,
  randomBytes, randomId, safeEqual, sha256, utf8, vaultDecrypt, vaultEncrypt,
} from '../lib/crypto.js';

describe('lib/crypto.js', () => {
  describe('base64url', () => {
    it('round-trips every length from 0 to 70 bytes', () => {
      for (let n = 0; n <= 70; n++) {
        const bytes = randomBytes(n);
        const s = b64urlEncode(bytes);
        assert.match(s, /^[A-Za-z0-9_-]*$/, 'only URL-safe characters, no padding');
        assert.deepEqual(b64urlDecode(s), bytes);
      }
    });

    it('uses - and _ instead of + and / and drops padding', () => {
      assert.equal(b64urlEncode(new Uint8Array([0xfb, 0xff])), '-_8');
      assert.equal(b64urlEncode(new Uint8Array([0xff, 0xfe, 0xfd])), '__79');
      assert.equal(b64urlEncode(new Uint8Array([1])), 'AQ');
      assert.equal(b64urlEncode(new Uint8Array([])), '');
    });

    it('accepts an ArrayBuffer or plain array as input', () => {
      assert.equal(b64urlEncode(new Uint8Array([1, 2, 3]).buffer), 'AQID');
      assert.equal(b64urlEncode([1, 2, 3]), 'AQID');
    });

    it('rejects standard-base64 characters, padding, whitespace and non-strings', () => {
      for (const bad of ['ab+c', 'ab/c', 'AQ==', 'AQ=', 'A Q', 'AQ\n', '%41', 'é']) {
        assert.throws(() => b64urlDecode(bad), /invalid base64url/, JSON.stringify(bad));
      }
      for (const bad of [null, undefined, 42, {}, ['AQ'], new Uint8Array([1])]) {
        assert.throws(() => b64urlDecode(bad), /invalid base64url/);
      }
    });

    it('rejects an impossible length (4n+1 characters)', () => {
      assert.throws(() => b64urlDecode('A'));
      assert.throws(() => b64urlDecode('AAAAA'));
    });
  });

  describe('utf8 helpers', () => {
    it('round-trip non-ASCII text', () => {
      const s = 'pässwörd ✓ 日本 🚀';
      assert.equal(fromUtf8(utf8(s)), s);
      assert.equal(utf8('€').length, 3);
      assert.equal(fromUtf8(utf8(123)), '123');
    });
  });

  describe('random values', () => {
    it('randomBytes returns the requested length', () => {
      assert.equal(randomBytes(0).length, 0);
      assert.equal(randomBytes(32).length, 32);
    });

    it('randomId is URL-safe, 16 characters and unique', () => {
      const ids = new Set();
      for (let i = 0; i < 500; i++) {
        const id = randomId();
        assert.match(id, /^[A-Za-z0-9_-]{16}$/);
        ids.add(id);
      }
      assert.equal(ids.size, 500);
    });
  });

  describe('HMAC', () => {
    it('signs deterministically and verifies only the right secret and data', async () => {
      const a = await hmacSign('k1', 'hello');
      const b = await hmacSign('k1', 'hello');
      assert.equal(a.length, 32);
      assert.deepEqual(a, b);
      assert.notDeepEqual(await hmacSign('k2', 'hello'), a);
      assert.equal(await hmacVerify('k1', 'hello', a), true);
      assert.equal(await hmacVerify('k2', 'hello', a), false);
      assert.equal(await hmacVerify('k1', 'hellO', a), false);
      const flipped = a.slice();
      flipped[5] ^= 1;
      assert.equal(await hmacVerify('k1', 'hello', flipped), false);
      assert.equal(await hmacVerify('k1', 'hello', a.slice(0, 16)), false);
    });

    it('sha256 matches a known vector', async () => {
      const d = await sha256('abc');
      assert.equal(Buffer.from(d).toString('hex'),
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
  });

  describe('safeEqual', () => {
    it('is true only for identical strings', async () => {
      assert.equal(await safeEqual('secret', 'secret'), true);
      assert.equal(await safeEqual('', ''), true);
      assert.equal(await safeEqual('secret', 'Secret'), false);
      assert.equal(await safeEqual('secret', 'secret '), false);
      assert.equal(await safeEqual('secret', 'secre'), false);
      assert.equal(await safeEqual('a', ''), false);
      assert.equal(await safeEqual('ü', 'u'), false);
    });

    it('compares string forms of non-string input', async () => {
      assert.equal(await safeEqual(123, '123'), true);
      assert.equal(await safeEqual(undefined, 'undefined'), true);
      assert.equal(await safeEqual(null, ''), false);
    });
  });

  describe('vault (AES-256-GCM)', () => {
    it('encrypts to the enc:v1 format and decrypts back', async () => {
      for (const pt of ['hunter2', '', '  spaces kept  ', 'ünïcødé 🚀', 'x'.repeat(500)]) {
        const ct = await vaultEncrypt('vault-key', pt);
        assert.ok(ct.startsWith(VAULT_PREFIX));
        assert.match(ct, /^enc:v1:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]+$/);
        if (pt) assert.ok(!ct.includes(pt));
        assert.equal(await vaultDecrypt('vault-key', ct), pt);
      }
    });

    it('uses a fresh IV every time', async () => {
      const a = await vaultEncrypt('vault-key', 'same');
      const b = await vaultEncrypt('vault-key', 'same');
      assert.notEqual(a, b);
      assert.notEqual(a.split(':')[2], b.split(':')[2]);
    });

    it('rejects the wrong key', async () => {
      const ct = await vaultEncrypt('right-key', 'hunter2');
      await assert.rejects(vaultDecrypt('wrong-key', ct));
      await assert.rejects(vaultDecrypt('', ct));
    });

    it('rejects tampered ciphertext and IV', async () => {
      const ct = await vaultEncrypt('vault-key', 'hunter2');
      const [, , iv, body] = ct.split(':');
      const flip = (s) => (s[0] === 'A' ? 'B' : 'A') + s.slice(1);
      await assert.rejects(vaultDecrypt('vault-key', `${VAULT_PREFIX}${iv}:${flip(body)}`));
      await assert.rejects(vaultDecrypt('vault-key', `${VAULT_PREFIX}${flip(iv)}:${body}`));
      await assert.rejects(vaultDecrypt('vault-key', `${VAULT_PREFIX}${iv}:${body.slice(0, -2)}`));
    });

    it('rejects malformed values', async () => {
      for (const bad of ['enc:v1:', 'enc:v1:abc', 'enc:v1::abc', 'enc:v1:abc:', 'enc:v1:a+b:c/d', 'plain']) {
        await assert.rejects(vaultDecrypt('vault-key', bad), JSON.stringify(bad));
      }
    });

    it('isEncrypted recognises only vault strings', async () => {
      assert.equal(isEncrypted(await vaultEncrypt('k', 'x')), true);
      assert.equal(isEncrypted('enc:v1:anything'), true);
      assert.equal(isEncrypted('hunter2'), false);
      assert.equal(isEncrypted('ENC:V1:abc'), false);
      assert.equal(isEncrypted(''), false);
      assert.equal(isEncrypted(null), false);
      assert.equal(isEncrypted(undefined), false);
      assert.equal(isEncrypted({ toString: () => 'enc:v1:x' }), false);
    });
  });
});
