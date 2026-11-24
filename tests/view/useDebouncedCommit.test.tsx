import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flushPendingDebouncedCommits,
  hasPendingDebouncedCommits,
} from '../../src/controller/local/EditController/debounceRegistry';
import { useDebouncedCommit } from '../../src/view/hooks/useDebouncedCommit';

let trigger: (v: string) => void;

const Field = ({ commit }: { commit: (v: string) => void }) => {
  trigger = useDebouncedCommit(commit, 1000);
  return null;
};

describe('useDebouncedCommit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits after the wait', () => {
    const commit = vi.fn();
    render(<Field commit={commit} />);
    trigger('a');
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(commit).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('flushes a pending commit when the control unmounts', () => {
    const commit = vi.fn();
    const { unmount } = render(<Field commit={commit} />);
    trigger('a');
    unmount();
    expect(commit).toHaveBeenCalledExactlyOnceWith('a');
    expect(hasPendingDebouncedCommits()).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('is flushed by the commit path and runs the latest callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Field commit={first} />);
    trigger('a');
    rerender(<Field commit={second} />);
    flushPendingDebouncedCommits();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith('a');
  });
});
