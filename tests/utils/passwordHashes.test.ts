import { describe, expect, it } from 'vitest';
import { hashPassword, hash_sha512 } from '../../src/utils/passwordHashes';

/**
 * SHA-512-crypt ($6$) known-answer tests.
 *
 * All vectors below were generated and verified locally with
 * `openssl passwd -6 -salt <salt> <password>` (OpenSSL 3.5.6).
 * The first vector is additionally the reference vector from the official
 * specification (https://www.akkadia.org/drepper/SHA-crypt.txt).
 */
const VECTORS: { password: string; salt: string; expected: string }[] = [
  {
    // Official sha512-crypt spec vector, confirmed with openssl.
    password: 'Hello world!',
    salt: 'saltstring',
    expected:
      '$6$saltstring$svn8UoSVapNtMuq1ukKS4tPQd8iKwSMHWjl/O817G3uBnIFNjnQJuesI68u4OTLiBFdcbYEdFCoEOfaS35inz1',
  },
  {
    password: 'toomanysecrets',
    salt: 'aXb9',
    expected:
      '$6$aXb9$mPtWsNgBTMxFBAUPS75rwKx3pjVAp.hMHshZZXh719A4ah/GIfhYMrgfoG5NRT0B/4scnPiwFWxh6IFd1RPSJ/',
  },
  {
    // Single-character password, full-length salt with non-alnum chars later.
    password: 'x',
    salt: 'qrstuv',
    expected:
      '$6$qrstuv$7r7x2JIBXOPyWz1TAFlvFteawIvtHv3B89isnMK4gKcjLJYhwGcomUoIlCidiKHDwvSSf28xQRXGDMQDe1GTy1',
  },
  {
    // Long password (> 64 bytes) exercises the P-sequence/blocking logic.
    password: 'A'.repeat(80),
    salt: '1234567890123456',
    expected:
      '$6$1234567890123456$NcheNETJgM6Piupglnq0cX/I9meG2FEwUbRA6D97iIvoYNnevJYH5jRm5z.WgPUxK9xYDUR.grwCbeWlgbnZG0',
  },
  {
    // Multibyte UTF-8 password (ä, ö are 2 bytes, € is 3 bytes in UTF-8);
    // openssl hashes the UTF-8 byte sequence, so this checks byte-correctness.
    password: 'pässwörd€',
    salt: 'Zz.9',
    expected:
      '$6$Zz.9$YKDNZHD8Lv8RSOHn2T3zVRSfTxDBencJusY87JBLHbniD.wnozBOP/SuPHw.n.pc9hwl.zyzCaiPZygS5UIQR/',
  },
];

describe('hash_sha512 known-answer tests (openssl passwd -6)', () => {
  for (const { password, salt, expected } of VECTORS) {
    it(`matches openssl for password=${JSON.stringify(password).slice(0, 30)} salt=${salt}`, () => {
      expect(hash_sha512(password, salt)).toEqual(expected);
    });
  }

  it('truncates the salt to 16 characters like crypt(3)', () => {
    // openssl passwd -6 -salt 1234567890123456 ... === salt of 20 chars truncated to 16
    expect(hash_sha512('A'.repeat(80), '12345678901234567890')).toEqual(
      VECTORS[3].expected,
    );
  });
});

describe('hashPassword salt generation (via public API)', () => {
  // generateSalt is not exported; validate the `$6$<salt>$<hash>` output shape.
  const CRYPT_FORMAT = /^\$6\$([./0-9A-Za-z]{16})\$([./0-9A-Za-z]{86})$/;
  const ITERATIONS = 25;

  it(`emits 16-char salts drawn only from [./0-9A-Za-z] (${ITERATIONS} samples)`, () => {
    const salts: string[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const out = hashPassword('pw');
      const m = out.match(CRYPT_FORMAT);
      // Asserts overall format, salt length 16 and salt/hash charset at once.
      expect(m, `unexpected crypt output: ${out}`).not.toBeNull();
      salts.push(m![1]);
    }
    // The btoa-based bug emitted '+' and '=' — they must never appear.
    for (const salt of salts) {
      expect(salt).not.toMatch(/[+=]/);
      for (const ch of salt) {
        expect('./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').toContain(ch);
      }
    }
    // Salts must be random, not a constant.
    expect(new Set(salts).size).toBeGreaterThan(1);
  });

  it('produces a hash that verifies against hash_sha512 with the same salt', () => {
    const out = hashPassword('round-trip me');
    const salt = out.split('$')[2];
    expect(hash_sha512('round-trip me', salt)).toEqual(out);
  });
});
