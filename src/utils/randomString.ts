export type RandomStringFormat =
  | 'uuid'
  | 'alphanumeric'
  | 'hex'
  | 'base64url'
  | 'ascii_printable'
  | 'custom';

export const RANDOM_STRING_FORMATS: RandomStringFormat[] = [
  'uuid',
  'alphanumeric',
  'hex',
  'base64url',
  'ascii_printable',
  'custom',
];

const CHARSETS: Record<Exclude<RandomStringFormat, 'uuid' | 'custom'>, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  hex: '0123456789abcdef',
  base64url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  ascii_printable:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
    '!#$%&()*+,-./:;<=>?@[]^_{|}~',
};

/**
 * Cryptographically uniform random string drawn from the given alphabet.
 * Rejection-samples bytes so the distribution is unbiased even for alphabets
 * whose size does not divide 256. The alphabet is treated as a set of
 * UTF-16 code units and must have at most 256 distinct characters.
 */
export function randomFromAlphabet(length: number, alphabet: string): string {
  const chars = Array.from(new Set(alphabet.split('')));
  const max = Math.floor(256 / chars.length) * chars.length;
  let out = '';
  const buf = new Uint8Array(Math.max(length * 2, 32));
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < max) out += chars[buf[i] % chars.length];
    }
  }
  return out;
}

/**
 * Generate a random string in the given format.
 *
 *   - `uuid` — a random (version 4) UUID; `length` and `charset` are ignored.
 *   - `alphanumeric` / `hex` / `base64url` / `ascii_printable` — `length`
 *     characters drawn from the named built-in alphabet.
 *   - `custom` — `length` characters drawn from the caller-supplied
 *     `charset` string.
 *
 * Throws on an unknown format or a `custom` format without a usable charset
 * (empty, or more than 256 distinct characters).
 */
export function generateRandomString(
  format: RandomStringFormat,
  length: number,
  charset?: string,
): string {
  if (format === 'uuid') return crypto.randomUUID();
  let alphabet: string;
  if (format === 'custom') {
    if (!charset || new Set(charset.split('')).size > 256) {
      throw new Error("format 'custom' requires a 'charset' of 1 to 256 distinct characters");
    }
    alphabet = charset;
  } else {
    alphabet = CHARSETS[format];
    if (alphabet === undefined) throw new Error(`unknown random string format '${format}'`);
  }
  return randomFromAlphabet(length, alphabet);
}
