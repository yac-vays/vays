import { useRef } from 'react';

/**
 * Stable React keys for the rows of an array renderer. With the index as key,
 * the state of a row's controls (typed text, open accordion, a just-generated
 * secret) would stay at its position when a row above it is removed.
 *
 * Call `remove(i)` right before removing item `i` from the data.
 */
export function useRowKeys(length: number | undefined): { keys: number[]; remove: (index: number) => void } {
  const keys = useRef<number[]>([]);
  const next = useRef(0);

  const count = length || 0;
  while (keys.current.length < count) keys.current.push(next.current++);
  keys.current.length = count;

  return { keys: keys.current, remove: (index) => keys.current.splice(index, 1) };
}
