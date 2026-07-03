/* eslint-disable @typescript-eslint/no-explicit-any */
import { debounce } from 'lodash';

/**
 * Registry of the panes' debounced commit functions (the `trackedDebounce`
 * wrappers around `handleChange` / the editor validate). Panes register their
 * debounced function on mount and deregister (cancelling any pending
 * invocation) on unmount.
 *
 * The commit path calls {@link flushPendingDebouncedCommits} before reading the
 * YAML to save, so an edit still sitting in a debounce window (0.5–1.5s) is not
 * silently dropped when the user clicks Commit quickly after typing. Cross-pane
 * rewrites consult {@link hasPendingDebouncedCommits} so a validation response
 * never overwrites input that is newer than itself.
 */

/** A debounced function that also reports whether an invocation is pending. */
export interface TrackedDebounced<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
  /** True while a call sits in the debounce window (input not yet committed). */
  pending(): boolean;
}

/**
 * `lodash.debounce` plus a `pending()` probe (the installed lodash has none):
 * pending from the first call until the wrapped function actually runs (or the
 * debounce is cancelled).
 */
export function trackedDebounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): TrackedDebounced<T> {
  let pending = false;
  const inner = debounce((...args: Parameters<T>) => {
    pending = false;
    return fn(...args);
  }, wait);
  const wrapped = ((...args: Parameters<T>) => {
    pending = true;
    inner(...args);
  }) as TrackedDebounced<T>;
  wrapped.cancel = () => {
    pending = false;
    inner.cancel();
  };
  wrapped.flush = () => {
    inner.flush();
  };
  wrapped.pending = () => pending;
  return wrapped;
}

type AnyTracked = TrackedDebounced<(...args: any[]) => any>;

const registered = new Set<AnyTracked>();

/** Register a pane's debounced commit function (on mount). */
export function registerDebouncedCommit(fn: AnyTracked) {
  registered.add(fn);
}

/** Cancel + deregister a pane's debounced commit function (on unmount). */
export function deregisterDebouncedCommit(fn: AnyTracked) {
  fn.cancel();
  registered.delete(fn);
}

/** Immediately invoke every pending debounced commit (start of the save path). */
export function flushPendingDebouncedCommits() {
  for (const fn of [...registered]) {
    fn.flush();
  }
}

/**
 * Whether any registered commit is still waiting in its debounce window, i.e.
 * a pane holds user input newer than every in-flight validation.
 */
export function hasPendingDebouncedCommits(): boolean {
  for (const fn of registered) {
    if (fn.pending()) return true;
  }
  return false;
}
