/**
 * Specification is here...
 * https://www.akkadia.org/drepper/SHA-crypt.txt
 *
 */

import { Buffer } from 'buffer';
import { sha512 } from '@noble/hashes/sha2';

const vocab = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateSalt(length = 16) {
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  const base64String = btoa(String.fromCharCode(...randomValues));

  // Remove padding '=' from Base64 and slice to 16 characters
  return base64String.replace(/=+$/, '').slice(0, 16); // Remove padding and slice to 16
}

export function rencode(a: number, b: number, c: number, len: number) {
  let ret = '';
  let w = (a << 16) | (b << 8) | c;
  ret += vocab.substring(w & 0x3f, (w & 0x3f) + 1);
  w >>>= 6;
  ret += vocab.substring(w & 0x3f, (w & 0x3f) + 1);
  w >>>= 6;
  ret += vocab.substring(w & 0x3f, (w & 0x3f) + 1);
  w >>>= 6;
  ret += vocab.substring(w & 0x3f, (w & 0x3f) + 1);
  return ret.substring(0, len);
}

export function hashPassword(password: string) {
  return hash_sha512(password, generateSalt());
}
export function hash_sha512(password: string, salt: string) {
  // TODO: Type fix!
  const algoID = '6';
  const len = 64;
  const maxSaltLen = 16;
  const key = Buffer.from(password);
  const saltBuf = Buffer.from(salt.substring(0, maxSaltLen));
  const rounds = 5000;

  const hashA = sha512.create();
  const hashB = sha512.create();

  hashA.update(key);
  hashA.update(saltBuf);
  hashB.update(key);
  hashB.update(saltBuf);
  hashB.update(key);
  const hashBResult = hashB.digest();

  let i;
  for (i = key.length; i > len; i -= len) {
    hashA.update(hashBResult);
  }
  hashA.update(hashBResult.subarray(0, i));

  for (let j = key.length; j > 0; j >>>= 1) {
    hashA.update(j & 1 ? hashBResult : key);
  }

  const hashAResult = hashA.digest();

  const hashDP = sha512.create();
  for (let j = 0; j < key.length; j++) {
    hashDP.update(key);
  }
  const hashDPResult = Buffer.from(hashDP.digest());

  const bufP = Buffer.alloc(key.length);
  for (i = 0; i + len < key.length; i += len) {
    hashDPResult.copy(bufP, i);
  }
  hashDPResult.copy(bufP, i, 0, key.length - i);

  const hashDS = sha512.create();
  for (let j = 0; j < 16 + hashAResult[0]; j++) {
    hashDS.update(saltBuf);
  }
  const hashDSResult = Buffer.from(hashDS.digest());

  const bufS = Buffer.alloc(saltBuf.length);
  for (i = 0; i + len < saltBuf.length; i += len) {
    hashDSResult.copy(bufS, i);
  }
  hashDSResult.copy(bufS, i, 0, saltBuf.length - i);

  let hashAC = hashAResult;
  for (let r = 0; r < rounds; r++) {
    const hashC = sha512.create();
    hashC.update(r & 1 ? bufP : hashAC);
    if (r % 3) hashC.update(bufS);
    if (r % 7) hashC.update(bufP);
    hashC.update(r & 1 ? hashAC : bufP);
    hashAC = hashC.digest();
  }

  let hash = '';
  // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
  hash += rencode(hashAC[0], hashAC[21], hashAC[42], 4);
  hash += rencode(hashAC[22], hashAC[43], hashAC[1], 4);
  hash += rencode(hashAC[44], hashAC[2], hashAC[23], 4);
  hash += rencode(hashAC[3], hashAC[24], hashAC[45], 4);
  hash += rencode(hashAC[25], hashAC[46], hashAC[4], 4);
  hash += rencode(hashAC[47], hashAC[5], hashAC[26], 4);
  hash += rencode(hashAC[6], hashAC[27], hashAC[48], 4);
  hash += rencode(hashAC[28], hashAC[49], hashAC[7], 4);
  hash += rencode(hashAC[50], hashAC[8], hashAC[29], 4);
  hash += rencode(hashAC[9], hashAC[30], hashAC[51], 4);
  hash += rencode(hashAC[31], hashAC[52], hashAC[10], 4);
  hash += rencode(hashAC[53], hashAC[11], hashAC[32], 4);
  hash += rencode(hashAC[12], hashAC[33], hashAC[54], 4);
  hash += rencode(hashAC[34], hashAC[55], hashAC[13], 4);
  hash += rencode(hashAC[56], hashAC[14], hashAC[35], 4);
  hash += rencode(hashAC[15], hashAC[36], hashAC[57], 4);
  hash += rencode(hashAC[37], hashAC[58], hashAC[16], 4);
  hash += rencode(hashAC[59], hashAC[17], hashAC[38], 4);
  hash += rencode(hashAC[18], hashAC[39], hashAC[60], 4);
  hash += rencode(hashAC[40], hashAC[61], hashAC[19], 4);
  hash += rencode(hashAC[62], hashAC[20], hashAC[41], 4);
  hash += rencode(0, 0, hashAC[63], 2);

  return `$${algoID}$${saltBuf.toString()}$${hash}`;
}
