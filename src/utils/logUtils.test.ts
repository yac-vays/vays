import { describe, expect, it } from 'vitest';
import { progressColor, sortLatestFirst } from './logUtils';

describe('progressColor', () => {
  it('uses the anchor colors at 0 and 100', () => {
    expect(progressColor(0)).toBe('#EAB308');
    expect(progressColor(100)).toBe('#10B981');
  });

  it('clamps out-of-range and invalid values', () => {
    expect(progressColor(-20)).toBe('#EAB308');
    expect(progressColor(140)).toBe('#10B981');
    expect(progressColor(NaN)).toBe('#EAB308');
  });

  it('blends between the anchors', () => {
    expect(progressColor(25)).toBe('#B4B526');
    expect(progressColor(50)).toBe('#7DB645');
    expect(progressColor(75)).toBe('#47B863');
  });
});

describe('sortLatestFirst', () => {
  it('orders by time and puts unparsable times last', () => {
    const entries = [
      { time: 'soon', id: 'x' },
      { time: '2026-01-01T10:00:00Z', id: 'old' },
      { time: null, id: 'y' },
      { time: '2026-01-02T10:00:00Z', id: 'new' },
    ];
    expect(sortLatestFirst(entries).map((e) => e.id)).toEqual(['new', 'old', 'x', 'y']);
  });
});
