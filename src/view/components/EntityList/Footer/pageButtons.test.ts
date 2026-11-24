import { describe, expect, it } from 'vitest';
import { PAGE_GAP as G, pageButtons } from './pageButtons';

describe('pageButtons', () => {
  it('lists every page up to 7 pages', () => {
    expect(pageButtons(1, 0)).toEqual([]);
    expect(pageButtons(1, 1)).toEqual([1]);
    expect(pageButtons(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows the first, the last and the current page with its neighbours', () => {
    expect(pageButtons(1, 20)).toEqual([1, 2, G, 20]);
    expect(pageButtons(2, 20)).toEqual([1, 2, 3, G, 20]);
    expect(pageButtons(3, 20)).toEqual([1, 2, 3, 4, G, 20]);
    expect(pageButtons(4, 20)).toEqual([1, G, 3, 4, 5, G, 20]);
    expect(pageButtons(10, 20)).toEqual([1, G, 9, 10, 11, G, 20]);
    expect(pageButtons(17, 20)).toEqual([1, G, 16, 17, 18, G, 20]);
    expect(pageButtons(18, 20)).toEqual([1, G, 17, 18, 19, 20]);
    expect(pageButtons(19, 20)).toEqual([1, G, 18, 19, 20]);
    expect(pageButtons(20, 20)).toEqual([1, G, 19, 20]);
  });

  it('copes with a page outside the range', () => {
    expect(pageButtons(0, 20)).toEqual([1, G, 20]);
    expect(pageButtons(25, 20)).toEqual([1, G, 20]);
  });
});
