import { describe, expect, it } from 'vitest';
import { progressColor } from './logUtils';

describe('progressColor', () => {
  it('uses the anchor colors at 0, 50 and 100', () => {
    expect(progressColor(0)).toBe('#DC3545');
    expect(progressColor(50)).toBe('#F59E0B');
    expect(progressColor(100)).toBe('#10B981');
  });

  it('clamps out-of-range and invalid values', () => {
    expect(progressColor(-20)).toBe('#DC3545');
    expect(progressColor(140)).toBe('#10B981');
    expect(progressColor(NaN)).toBe('#DC3545');
  });

  it('blends between the anchors', () => {
    expect(progressColor(25)).toBe('#E96A28');
    expect(progressColor(75)).toBe('#83AC46');
  });
});
