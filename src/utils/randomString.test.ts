import { describe, expect, it } from 'vitest';
import { generateRandomString, randomFromAlphabet } from './randomString';

describe('randomFromAlphabet', () => {
  it('returns the requested length using only alphabet characters', () => {
    const out = randomFromAlphabet(100, 'abc');
    expect(out).toHaveLength(100);
    expect(out).toMatch(/^[abc]+$/);
  });

  it('works with a single-character alphabet', () => {
    expect(randomFromAlphabet(5, 'x')).toBe('xxxxx');
  });
});

describe('generateRandomString', () => {
  it('generates a v4 UUID for format uuid, ignoring length', () => {
    const out = generateRandomString('uuid', 5);
    expect(out).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('respects length for the built-in charsets', () => {
    expect(generateRandomString('hex', 16)).toMatch(/^[0-9a-f]{16}$/);
    expect(generateRandomString('alphanumeric', 24)).toMatch(/^[A-Za-z0-9]{24}$/);
    expect(generateRandomString('base64url', 24)).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(generateRandomString('ascii_printable', 24)).toHaveLength(24);
  });

  it('draws from the given charset for format custom', () => {
    expect(generateRandomString('custom', 30, '01')).toMatch(/^[01]{30}$/);
  });

  it('throws for format custom without a charset', () => {
    expect(() => generateRandomString('custom', 10)).toThrow(/charset/);
  });

  it('throws for an unknown format', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => generateRandomString('nope' as any, 10)).toThrow(/unknown/);
  });

  it('produces different values on subsequent calls', () => {
    expect(generateRandomString('hex', 32)).not.toBe(generateRandomString('hex', 32));
  });
});
