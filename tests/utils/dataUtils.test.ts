/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  getAllErrors,
  hasAtPath,
  removeOldData,
  setUndefinedAtPath,
} from '../../src/utils/schema/dataUtils';
import { isInjectedNameKey } from '../../src/utils/schema/injectName';

describe('Check injectName', async () => {
  it('Check if injectedName key is not too trivial', async () => {
    const keys = ['schema', '', 'action', 'name', 'entityName', 'entity-name'];
    for (const key of keys) expect(isInjectedNameKey(key)).equals(false);
  });
});

describe('removeOldData reports stripped paths', () => {
  const ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });
  // Mimics a `yac_if` whose condition is now false: `enabled` is allowed, the
  // conditional `extra` (and a nested one) are no longer part of the schema.
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      enabled: { type: 'boolean' },
      networking: {
        type: 'object',
        additionalProperties: false,
        properties: { dhcp: { type: 'boolean' } },
      },
    },
  };

  it('strips a top-level forbidden key and returns its path', () => {
    const data: any = { enabled: false, extra: 'default' };
    const removed = removeOldData(data, getAllErrors(data, schema, ajv));
    expect(data).toEqual({ enabled: false });
    expect(removed).toContainEqual(['extra']);
  });

  it('strips a nested forbidden key and returns its full path', () => {
    const data: any = { enabled: false, networking: { dhcp: true, gateway: '10.0.0.1' } };
    const removed = removeOldData(data, getAllErrors(data, schema, ajv));
    expect(data).toEqual({ enabled: false, networking: { dhcp: true } });
    expect(removed).toContainEqual(['networking', 'gateway']);
  });

  it('returns no paths when the data already conforms', () => {
    const data: any = { enabled: true };
    expect(removeOldData(data, getAllErrors(data, schema, ajv))).toHaveLength(0);
  });
});

describe('setUndefinedAtPath / hasAtPath', () => {
  it('marks a top-level key as ~undefined', () => {
    const patch: any = {};
    setUndefinedAtPath(patch, ['extra']);
    expect(patch).toEqual({ extra: '~undefined' });
  });

  it('creates missing intermediate objects for a nested unset', () => {
    const patch: any = {};
    setUndefinedAtPath(patch, ['networking', 'gateway']);
    expect(patch).toEqual({ networking: { gateway: '~undefined' } });
  });

  it('preserves sibling keys already in the patch', () => {
    const patch: any = { networking: { dhcp: true } };
    setUndefinedAtPath(patch, ['networking', 'gateway']);
    expect(patch).toEqual({ networking: { dhcp: true, gateway: '~undefined' } });
  });

  it('bails on array-nested paths (covered by wholesale list replacement)', () => {
    const patch: any = {};
    setUndefinedAtPath(patch, ['items', '0', 'extra']);
    expect(patch).toEqual({});
  });

  it('hasAtPath detects present and absent keys', () => {
    const data = { networking: { dhcp: true } };
    expect(hasAtPath(data, ['networking', 'dhcp'])).toBe(true);
    expect(hasAtPath(data, ['networking', 'gateway'])).toBe(false);
    expect(hasAtPath(data, ['missing'])).toBe(false);
  });
});
