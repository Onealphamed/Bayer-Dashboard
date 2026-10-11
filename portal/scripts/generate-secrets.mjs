/*
 * Prints fresh values for the portal's secret environment variables.
 *   node scripts/generate-secrets.mjs            (or: npm run secrets)
 *   node scripts/generate-secrets.mjs myname     (sets the login ID)
 *
 * Paste the output into Vercel -> Project -> Settings -> Environment Variables.
 * Nothing is written to disk.
 */
import { randomBytes, randomInt } from 'node:crypto';

// No look-alike characters (0/O, 1/l/I) so the password can be read aloud or retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function password(length = 20) {
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

const username = process.argv[2] || 'admin';

console.log(`PORTAL_USERNAME=${username}`);
console.log(`PORTAL_PASSWORD=${password()}`);
console.log(`SESSION_SECRET=${b64url(randomBytes(48))}`);
console.log(`VAULT_KEY=${b64url(randomBytes(32))}`);
console.error('\nKeep VAULT_KEY safe: dashboard passwords saved in the hub can only be decrypted with it.');
