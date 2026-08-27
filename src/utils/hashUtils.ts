/**
 * Fast hash function with weak collision guarantees, defenitely don't use for any
 * cryptographic purposes. Taken from
 * https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript.
 * @param s
 * @returns
 */
export const hashCode = function (s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
};
