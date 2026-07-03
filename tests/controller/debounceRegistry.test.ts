import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deregisterDebouncedCommit,
  flushPendingDebouncedCommits,
  registerDebouncedCommit,
  trackedDebounce,
} from '../../src/controller/local/EditController/debounceRegistry';

describe('debounceRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushPendingDebouncedCommits runs every pending fn exactly once, without timer advance', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const d1 = trackedDebounce(spy1, 1000);
    const d2 = trackedDebounce(spy2, 500);
    registerDebouncedCommit(d1);
    registerDebouncedCommit(d2);

    d1('a');
    d2('b');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();

    flushPendingDebouncedCommits(); // no vi.advanceTimersByTime!
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledWith('a');
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledWith('b');

    // The debounce timers must not fire the fns a second time afterwards.
    vi.advanceTimersByTime(5000);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);

    deregisterDebouncedCommit(d1);
    deregisterDebouncedCommit(d2);
  });

  it('flush is a no-op for registered fns with nothing pending', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedCommit(d);

    flushPendingDebouncedCommits();
    expect(spy).not.toHaveBeenCalled();

    deregisterDebouncedCommit(d);
  });

  it('deregister cancels a pending invocation (fn never runs)', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedCommit(d);

    d('pending');
    deregisterDebouncedCommit(d);

    vi.advanceTimersByTime(5000);
    expect(spy).not.toHaveBeenCalled();

    // ... and a later flush does not resurrect it either.
    flushPendingDebouncedCommits();
    expect(spy).not.toHaveBeenCalled();
  });

  it('registering the same fn twice still flushes it exactly once (Set semantics)', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedCommit(d);
    registerDebouncedCommit(d);

    d();
    flushPendingDebouncedCommits();
    expect(spy).toHaveBeenCalledTimes(1);

    deregisterDebouncedCommit(d);
  });
});
