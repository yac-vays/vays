/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  deepDelete,
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

  it('tells array indices (numbers) from numeric-looking keys (strings)', () => {
    const nested = {
      type: 'object',
      properties: {
        disks: { type: 'array', items: { type: 'object', additionalProperties: false } },
        vlans: {
          type: 'object',
          additionalProperties: { type: 'object', additionalProperties: false },
        },
      },
    };
    const data: any = { disks: [{ extra: 1 }], vlans: { '100': { legacy: true } } };
    const removed = removeOldData(data, getAllErrors(data, nested, ajv));
    expect(data).toEqual({ disks: [{}], vlans: { '100': {} } });
    expect(removed).toContainEqual(['disks', 0, 'extra']);
    expect(removed).toContainEqual(['vlans', '100', 'legacy']);
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
    setUndefinedAtPath(patch, ['items', 0, 'extra']);
    expect(patch).toEqual({});
  });

  it('treats numeric-looking object keys as keys (e.g. VLAN ids)', () => {
    const patch: any = {};
    setUndefinedAtPath(patch, ['vlans', '100', 'legacy']);
    expect(patch).toEqual({ vlans: { '100': { legacy: '~undefined' } } });
  });

  it('hasAtPath detects present and absent keys', () => {
    const data = { networking: { dhcp: true } };
    expect(hasAtPath(data, ['networking', 'dhcp'])).toBe(true);
    expect(hasAtPath(data, ['networking', 'gateway'])).toBe(false);
    expect(hasAtPath(data, ['missing'])).toBe(false);
  });
});

describe('path helpers never touch the prototype chain', () => {
  // Paths are derived from the keys of entity data, e.g. a stored map with a
  // `__proto__` key the schema rejects.
  const UNSAFE = ['__proto__', 'constructor', 'prototype'];

  it('setUndefinedAtPath refuses prototype segments', () => {
    for (const seg of UNSAFE) {
      const payload: any = {};
      setUndefinedAtPath(payload, ['users', seg, 'polluted']);
      setUndefinedAtPath(payload, [seg, 'polluted']);
      setUndefinedAtPath(payload, [seg]);
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.keys(payload)).toEqual([]);
    }
  });

  it('setUndefinedAtPath does not walk into inherited members', () => {
    const payload: any = {};
    setUndefinedAtPath(payload, ['toString', 'polluted']);
    expect((Object.prototype.toString as any).polluted).toBeUndefined();
    expect(payload).toEqual({ toString: { polluted: '~undefined' } });
  });

  it('hasAtPath only sees own keys', () => {
    expect(hasAtPath({}, ['toString'])).toBe(false);
    expect(hasAtPath({}, ['__proto__'])).toBe(false);
    expect(hasAtPath({ a: {} }, ['a', 'constructor'])).toBe(false);
    expect(hasAtPath({ a: [1] }, ['a', '0'])).toBe(true);
  });

  it('deepDelete refuses prototype segments and inherited keys', () => {
    for (const seg of UNSAFE) {
      expect(deepDelete({ a: {} }, ['a', seg], 'toString')).toBe(false);
      expect(deepDelete({ a: {} }, ['a'], seg)).toBe(false);
    }
    expect(deepDelete({ a: {} }, ['a'], 'toString')).toBe(false);
    expect(typeof Object.prototype.toString).toBe('function');
    const data = { a: { b: 1, c: 2 } };
    expect(deepDelete(data, ['a'], 'b')).toBe(true);
    expect(data).toEqual({ a: { c: 2 } });
  });

  it('removeOldData skips a rejected `__proto__` key', () => {
    const data = JSON.parse('{"users": {"__proto__": {"x": 1}, "bad": 1}}');
    const errors: any[] = [
      {
        keyword: 'additionalProperties',
        instancePath: '/users',
        params: { additionalProperty: '__proto__' },
      },
      {
        keyword: 'additionalProperties',
        instancePath: '/users/__proto__',
        params: { additionalProperty: 'x' },
      },
      {
        keyword: 'additionalProperties',
        instancePath: '/users',
        params: { additionalProperty: 'bad' },
      },
    ];
    expect(removeOldData(data, errors)).toEqual([['users', 'bad']]);
  });
});

describe('getAllErrors', () => {
  it('reports a schema Ajv cannot compile instead of throwing', () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const seen: unknown[] = [];
    const errors = getAllErrors(
      { a: 'x' },
      { type: 'object', properties: { a: { type: 'string', pattern: '(?P<x>a)' } } },
      ajv,
      (e) => seen.push(e),
    );
    expect(errors).toBeNull();
    expect(seen).toHaveLength(1);
  });
});
