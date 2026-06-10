/* eslint-disable @typescript-eslint/no-explicit-any */
import { DebouncedFunc } from 'lodash';

/**
 * Registry of the renderers' debounced commit functions (the lodash `debounce`
 * wrappers around `handleChange`). Renderers register their debounced function
 * on mount and deregister (cancelling any pending invocation) on unmount.
 *
 * The commit path calls {@link flushPendingDebouncedCommits} before reading the
 * YAML to save, so an edit still sitting in a debounce window (0.5–1.5s) is not
 * silently dropped when the user clicks Commit quickly after typing.
 */
type AnyDebounced = DebouncedFunc<(...args: any[]) => any>;

const registered = new Set<AnyDebounced>();

/** Register a renderer's debounced commit function (on mount). */
export function registerDebouncedCommit(fn: AnyDebounced) {
  registered.add(fn);
}

/** Cancel + deregister a renderer's debounced commit function (on unmount). */
export function deregisterDebouncedCommit(fn: AnyDebounced) {
  fn.cancel();
  registered.delete(fn);
}

/** Immediately invoke every pending debounced commit (start of the save path). */
export function flushPendingDebouncedCommits() {
  for (const fn of [...registered]) {
    fn.flush();
  }
}
