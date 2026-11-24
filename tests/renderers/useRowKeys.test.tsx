import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRowKeys } from '../../src/renderers/utils/useRowKeys';

describe('useRowKeys', () => {
  it('keeps the keys of the remaining rows when one is removed', () => {
    const { result, rerender } = renderHook(({ n }) => useRowKeys(n), {
      initialProps: { n: 3 as number | undefined },
    });
    const [a, , c] = result.current.keys;
    result.current.remove(1);
    rerender({ n: 2 });
    expect(result.current.keys).toEqual([a, c]);

    // new rows get keys that were never used
    rerender({ n: 3 });
    expect(new Set([...result.current.keys, a, c]).size).toBe(3);
    expect(result.current.keys.slice(0, 2)).toEqual([a, c]);

    rerender({ n: undefined });
    expect(result.current.keys).toEqual([]);
  });
});
