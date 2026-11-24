import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deregisterDebouncedInput,
  flushPendingDebouncedInputs,
  registerDebouncedInput,
  trackedDebounce,
} from '../../src/controller/local/EditController/debounceRegistry';

describe('debounceRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushPendingDebouncedInputs runs every pending fn exactly once, without timer advance', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const d1 = trackedDebounce(spy1, 1000);
    const d2 = trackedDebounce(spy2, 500);
    registerDebouncedInput(d1);
    registerDebouncedInput(d2);

    d1('a');
    d2('b');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();

    flushPendingDebouncedInputs(); // no vi.advanceTimersByTime!
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledWith('a');
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledWith('b');

    // The debounce timers must not fire the fns a second time afterwards.
    vi.advanceTimersByTime(5000);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);

    deregisterDebouncedInput(d1);
    deregisterDebouncedInput(d2);
  });

  it('flush is a no-op for registered fns with nothing pending', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedInput(d);

    flushPendingDebouncedInputs();
    expect(spy).not.toHaveBeenCalled();

    deregisterDebouncedInput(d);
  });

  it('deregister cancels a pending invocation (fn never runs)', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedInput(d);

    d('pending');
    deregisterDebouncedInput(d);

    vi.advanceTimersByTime(5000);
    expect(spy).not.toHaveBeenCalled();

    // ... and a later flush does not resurrect it either.
    flushPendingDebouncedInputs();
    expect(spy).not.toHaveBeenCalled();
  });

  it('registering the same fn twice still flushes it exactly once (Set semantics)', () => {
    const spy = vi.fn();
    const d = trackedDebounce(spy, 1000);
    registerDebouncedInput(d);
    registerDebouncedInput(d);

    d();
    flushPendingDebouncedInputs();
    expect(spy).toHaveBeenCalledTimes(1);

    deregisterDebouncedInput(d);
  });
});
