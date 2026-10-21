import { describe, expect, it } from 'vitest';
import {
  buildLimitBar,
  clampToRange,
  dragRange,
  fieldBounds,
  formatAmount,
  LimitBarInput,
  snap,
  stepFor,
  valueAtFraction,
  valueAtPath,
} from '../../src/utils/limitBar';
import { LimitUsage } from '../../src/utils/types/api';

const usage = (used: number, max: number, title = 'CPU per OU'): LimitUsage => ({
  title,
  used,
  max,
  ok: used <= max,
  path: '#/spec/cpu',
});

/** buildLimitBar, failing the test (instead of a non-null assertion) on null. */
const bar = (over: Partial<LimitBarInput>) => {
  const m = buildLimitBar(input(over));
  if (m == null) throw new Error('no bar model');
  return m;
};

const input = (over: Partial<LimitBarInput>): LimitBarInput => ({
  usages: [usage(8, 10)],
  measuredData: { spec: { cpu: 2 } },
  path: 'spec.cpu',
  value: 2,
  initial: undefined,
  schema: {},
  step: 0.5,
  ...over,
});

describe('limitBar helpers', () => {
  it('reads values at a dot path', () => {
    expect(valueAtPath({ a: { b: { c: 3 } } }, 'a.b.c')).toBe(3);
    expect(valueAtPath({ a: 1 }, 'a.b')).toBeUndefined();
    expect(valueAtPath(null, 'a')).toBeUndefined();
  });

  it('snaps to the step grid without float noise', () => {
    expect(snap(0.30000000000000004, 0.1)).toBe(0.3);
    expect(snap(1.26, 0.25)).toBe(1.25);
    expect(snap(7, 1)).toBe(7);
  });

  it('derives the field bounds from the schema on the step grid', () => {
    expect(fieldBounds({}, 0.5)).toEqual({ lo: 0, hi: undefined });
    expect(fieldBounds({ minimum: 1, maximum: 4 }, 0.5)).toEqual({ lo: 1, hi: 4 });
    // exclusive bounds step one grid point inwards
    expect(fieldBounds({ exclusiveMinimum: 0, exclusiveMaximum: 3 }, 0.5)).toEqual({
      lo: 0.5,
      hi: 2.5,
    });
    expect(fieldBounds({ minimum: 0.3, maximum: 3.9 }, 0.5)).toEqual({ lo: 0.5, hi: 3.5 });
  });

  it('takes the step from multipleOf, else 1 for integers and 0.1 for numbers', () => {
    expect(stepFor({ type: 'number', multipleOf: 0.5 })).toBe(0.5);
    expect(stepFor({ type: 'integer', multipleOf: 10 })).toBe(10);
    expect(stepFor({ type: 'number' })).toBe(0.1);
    expect(stepFor({ type: 'integer' })).toBe(1);
    expect(stepFor({ type: 'integer', multipleOf: 0.5 })).toBe(1); // contradicting: ignored
    expect(stepFor({ type: 'number', multipleOf: -1 })).toBe(0.1);
  });

  it('formats with the step precision, at least two decimals, no trailing zeros', () => {
    expect(formatAmount(2, 0.5)).toBe('2');
    expect(formatAmount(0.25, 0.1)).toBe('0.25');
    expect(formatAmount(1 / 3, 1)).toBe('0.33');
  });
});

describe('buildLimitBar', () => {
  it('returns null without a usage', () => {
    expect(buildLimitBar(input({ usages: [] }))).toBeNull();
  });

  it('splits the usage into others and own, based on the validated value', () => {
    const m = bar({});
    expect(m).toMatchObject({ others: 6, own: 2, max: 10, free: 2, scaleMax: 10, level: 'near' });
    expect(bar({ value: 1 }).level).toBe('ok'); // 7/10
    expect(m.ownIsInitial).toBe(false);
  });

  it('keeps others stable while the shown value differs from the validated one', () => {
    // dragged to 3.5, the usage (8) still includes the validated 2
    const m = bar({ value: 3.5 });
    expect(m).toMatchObject({ others: 6, own: 3.5, free: 0.5, level: 'near' });
  });

  it('counts an unset field with its initial value', () => {
    const m = bar({ value: undefined, initial: 2, measuredData: { spec: {} } });
    expect(m).toMatchObject({ others: 6, own: 2, ownIsInitial: true });
  });

  it('extends the scale when over the cap', () => {
    const m = bar({ usages: [usage(12, 10)], value: 2 });
    expect(m).toMatchObject({ others: 10, own: 2, free: -2, scaleMax: 12, level: 'over' });
  });

  it('picks the tightest of several usages', () => {
    const m = bar({
      usages: [usage(8, 10, 'per OU'), usage(4, 20, 'global'), usage(5, 6, 'tight')],
    });
    // room left: per OU 10-6=4, global 20-2=18, tight 6-3=3
    expect(m.usage.title).toBe('tight');
    expect(m).toMatchObject({ others: 3, max: 6 });
  });

  it('never reports negative others', () => {
    const m = bar({ usages: [usage(1, 10)], measuredData: { spec: { cpu: 2 } } });
    expect(m.others).toBe(0);
  });
});

describe('dragging', () => {
  it('limits the range to the room in the cap and the field maximum', () => {
    const m = bar({ schema: { minimum: 0.5 } });
    expect(dragRange(m, m.own)).toEqual({ lo: 0.5, hi: 4 });
    const capped = bar({ schema: { minimum: 0.5, maximum: 3 } });
    expect(capped.fieldMax).toBe(3);
    expect(dragRange(capped, capped.own)).toEqual({ lo: 0.5, hi: 3 });
  });

  it('lets a value beyond the cap stay, but only shrink', () => {
    const m = bar({ usages: [usage(12, 10)] });
    // others 10 leave no room: hi falls back to the start value
    expect(dragRange(m, m.own)).toEqual({ lo: 0, hi: 2 });
  });

  it('maps pointer fractions to snapped, clamped values', () => {
    const m = bar({});
    const range = dragRange(m, m.own);
    expect(valueAtFraction(m, 0.7, range, 0.5)).toBe(1); // 7 - 6
    expect(valueAtFraction(m, 0.86, range, 0.5)).toBe(2.5); // 8.6 - 6 -> 2.6 -> 2.5
    expect(valueAtFraction(m, 1.5, range, 0.5)).toBe(4); // clamped to the cap
    expect(valueAtFraction(m, 0, range, 0.5)).toBe(0); // clamped to the minimum
    expect(clampToRange(9, range, 0.5)).toBe(4);
  });
});
