import * as age from 'age-encryption';
import { describe, expect, it } from 'vitest';
import {
  ageEncrypt,
  looksLikeAgeArmor,
  randomSecret,
  SecretCharset,
} from '../../src/utils/ageEncrypt';

describe('ageEncrypt', () => {
  it('round-trips: encrypt via src, decrypt via the age library', async () => {
    const identity = await age.generateIdentity();
    const recipient = await age.identityToRecipient(identity);
    const plaintext = 'top secret value — with unicode €✓';

    const armored = await ageEncrypt(plaintext, recipient);

    expect(armored.trimStart().startsWith('-----BEGIN AGE ENCRYPTED FILE-----')).toBe(true);
    expect(armored).toContain('-----END AGE ENCRYPTED FILE-----');

    const d = new age.Decrypter();
    d.addIdentity(identity);
    const decrypted = await d.decrypt(age.armor.decode(armored), 'text');
    expect(decrypted).toEqual(plaintext);
  });

  it('throws on an unparseable recipient', async () => {
    await expect(ageEncrypt('data', 'not-an-age-recipient')).rejects.toThrow();
  });
});

describe('looksLikeAgeArmor', () => {
  it('accepts armored ciphertext (also with leading whitespace)', async () => {
    const identity = await age.generateIdentity();
    const recipient = await age.identityToRecipient(identity);
    const armored = await ageEncrypt('x', recipient);
    expect(looksLikeAgeArmor(armored)).toBe(true);
    expect(looksLikeAgeArmor('\n  ' + armored)).toBe(true);
  });

  it('rejects non-armor values', () => {
    expect(looksLikeAgeArmor('plain text')).toBe(false);
    expect(looksLikeAgeArmor('')).toBe(false);
    expect(looksLikeAgeArmor('-----BEGIN PGP MESSAGE-----')).toBe(false);
    expect(looksLikeAgeArmor(undefined)).toBe(false);
    expect(looksLikeAgeArmor(null)).toBe(false);
    expect(looksLikeAgeArmor(42)).toBe(false);
    expect(looksLikeAgeArmor({ value: '-----BEGIN AGE ENCRYPTED FILE-----' })).toBe(false);
  });
});

describe('randomSecret', () => {
  const CHARSETS: Record<SecretCharset, string> = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    hex: '0123456789abcdef',
    base64url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    ascii_printable:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
      '!#$%&()*+,-./:;<=>?@[]^_{|}~',
  };

  it('respects the requested length', () => {
    for (const len of [1, 17, 32, 64, 100]) {
      expect(randomSecret(len, 'alphanumeric')).toHaveLength(len);
    }
    expect(randomSecret(0, 'hex')).toEqual('');
  });

  it('only emits characters from the requested charset', () => {
    for (const charset of Object.keys(CHARSETS) as SecretCharset[]) {
      const allowed = new Set(CHARSETS[charset]);
      const secret = randomSecret(500, charset);
      for (const ch of secret) {
        expect(allowed.has(ch), `char ${JSON.stringify(ch)} not in ${charset}`).toBe(true);
      }
    }
  });

  it('shows no obvious bias: every charset char appears over many samples', () => {
    for (const charset of Object.keys(CHARSETS) as SecretCharset[]) {
      const alphabet = CHARSETS[charset];
      // Coupon collector: expected draws to see all n chars is ~n*ln(n)
      // (< 420 for the 90-char set); 8000 draws make a miss astronomically
      // unlikely unless a char can never be produced.
      const seen = new Set(randomSecret(8000, charset));
      for (const ch of alphabet) {
        expect(seen.has(ch), `${JSON.stringify(ch)} never produced for ${charset}`).toBe(true);
      }
    }
  });

  it('produces different secrets across calls', () => {
    const a = randomSecret(32, 'alphanumeric');
    const b = randomSecret(32, 'alphanumeric');
    expect(a).not.toEqual(b);
  });
});
