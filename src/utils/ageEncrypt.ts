import * as age from 'age-encryption';
import { generateRandomString } from './randomString';

export type SecretCharset = 'alphanumeric' | 'hex' | 'base64url' | 'ascii_printable';

/** Cryptographically uniform random string drawn from the given charset. */
export function randomSecret(length: number, charset: SecretCharset): string {
  return generateRandomString(charset, length);
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
