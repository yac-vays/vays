import * as age from 'age-encryption';

export type SecretCharset = 'alphanumeric' | 'hex' | 'base64url' | 'ascii_printable';

const CHARSETS: Record<SecretCharset, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  hex: '0123456789abcdef',
  base64url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  ascii_printable:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
    '!#$%&()*+,-./:;<=>?@[]^_{|}~',
};

/**
 * Cryptographically uniform random string drawn from the given charset.
 * Rejection-samples bytes so the distribution is unbiased even for charsets
 * whose size does not divide 256.
 */
export function randomSecret(length: number, charset: SecretCharset): string {
  const alphabet = CHARSETS[charset];
  const max = Math.floor(256 / alphabet.length) * alphabet.length;
  let out = '';
  const buf = new Uint8Array(Math.max(length * 2, 32));
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < max) out += alphabet[buf[i] % alphabet.length];
    }
  }
  return out;
}

/**
 * Encrypt a string with an AGE recipient public key (`age1...`) and return
 * the ASCII-armored ciphertext (`-----BEGIN AGE ENCRYPTED FILE-----` ... ).
 *
 * Throws if the recipient cannot be parsed by the age library.
 */
export async function ageEncrypt(plaintext: string, recipient: string): Promise<string> {
  const e = new age.Encrypter();
  e.addRecipient(recipient);
  const ciphertext = await e.encrypt(plaintext);
  return age.armor.encode(ciphertext);
}

/**
 * Quick syntactic check: is this a string that looks like an armored AGE
 * ciphertext? Used to detect data that arrived from YAML in an unexpected
 * shape (so we can surface it as invalid and let the user overwrite).
 */
export function looksLikeAgeArmor(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.trimStart().startsWith('-----BEGIN AGE ENCRYPTED FILE-----')
  );
}
