import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { AJV_OPTIONS } from '../../src/controller/state/EditCtrlState';
import editingState from '../../src/controller/state/EditCtrlState';
import { multipleOfStep } from '../../src/renderers/utils/numberStep';

describe('multipleOfStep', () => {
  it('uses a positive, finite multipleOf', () => {
    expect(multipleOfStep({ type: 'number', multipleOf: 0.005 })).toBe(0.005);
    expect(multipleOfStep({ type: 'integer', multipleOf: 10 })).toBe(10);
  });
  it('ignores missing, invalid and type-contradicting ones', () => {
    expect(multipleOfStep({ type: 'number' })).toBeUndefined();
    expect(multipleOfStep({ type: 'number', multipleOf: 0 })).toBeUndefined();
    expect(multipleOfStep({ type: 'number', multipleOf: -1 })).toBeUndefined();
    expect(multipleOfStep({ type: 'number', multipleOf: '0.5' })).toBeUndefined();
    expect(multipleOfStep({ type: 'integer', multipleOf: 0.5 })).toBeUndefined();
  });
});

describe('Ajv multipleOf with decimals', () => {
  const values = Array.from({ length: 2000 }, (_, i) => Number(((i + 1) * 0.005).toFixed(3)));

  it('a plain Ajv rejects valid decimals (the reason for the option)', () => {
    const v = new Ajv({ strict: false }).compile({ type: 'number', multipleOf: 0.005 });
    expect(values.filter((x) => !v(x)).length).toBeGreaterThan(0);
  });

  it('the editor instances accept every multiple and still reject non-multiples', () => {
    expect(AJV_OPTIONS.multipleOfPrecision).toBeGreaterThan(0);
    for (const ajv of [editingState.ajv, editingState.ajvValidate]) {
      const v = ajv.compile({ type: 'number', multipleOf: 0.005 });
      expect(values.filter((x) => !v(x))).toEqual([]);
      expect(v(0.036)).toBe(false);
      expect(v(0.0051)).toBe(false);
    }
  });
});
