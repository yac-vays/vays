/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from 'react';
import {
  deregisterDebouncedInput,
  registerDebouncedInput,
  trackedDebounce,
  TrackedDebounced,
} from '../../controller/local/EditController/debounceRegistry';

/**
 * A debounced `commit` (typically a `handleChange` call) that is registered
 * with the commit path, so Commit flushes it before saving.
 *
 * The pending call always runs the latest `commit`. When the control unmounts
 * (e.g. the user switches the category tab) a pending call is flushed, not
 * dropped: the input was already shown as accepted.
 */
export function useDebouncedInput<A extends any[]>(
  commit: (...args: A) => void,
  wait: number,
): TrackedDebounced<(...args: A) => void> {
  const latest = useRef(commit);
  latest.current = commit;

  const debounced = useMemo(
    () => trackedDebounce((...args: A) => latest.current(...args), wait),
    [wait],
  );

  useEffect(() => {
    registerDebouncedInput(debounced);
    return () => {
      debounced.flush();
      deregisterDebouncedInput(debounced);
    };
  }, [debounced]);

  return debounced;
}
