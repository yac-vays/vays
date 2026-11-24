import { afterEach, describe, expect, it, vi } from 'vitest';
import { setPreviousDefaultsObject } from '../../src/controller/local/EditController/editState';
import { AppConfig } from '../../src/utils/types/config';
import { ValidateResponse } from '../../src/utils/types/internal/validation';
import {
  DEFAULT_YAML_COMMENT,
  getInitialCreateYAML,
  insertDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../src/utils/schema/defaultsHandling';

const cachedConfig = vi.hoisted(() => ({ value: null as Partial<AppConfig> | null }));
vi.mock('../../src/model/config', () => ({
  getCachedConfig: () => cachedConfig.value,
}));
afterEach(() => {
  cachedConfig.value = null;
});
const def = {
  type: 'object',
  properties: {
    a1: {
      type: 'string',
      default: 'a1-default',
    },
    a2: {
      type: 'string',
      pattern: '.*',
    },
    b1: {
      type: 'boolean',
      default: true,
    },
    b2: {
      type: 'boolean',
    },
    c1: {
      type: 'array',
      default: [1, 2, 3],
      items: {
        type: 'number',
      },
    },
    c2: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
    d1: {
      type: 'object',
      default: {
        a0: 1,
      },
      properties: {
        a0: {
          type: 'string',
        },
      },
    },
    d2: {
      type: 'object',
      properties: {
        a0: {
          type: 'string',
        },
      },
    },
  },
};

describe('Check default handling utils', async () => {
  it('Checks the default insertion in empty data object', async () => {
    const valResp = {
      json_schema: def,
      ui_schema: {
        type: '',
        elements: [],
      },
      data: {},
      valid: false,
      detail: '',
    };
    insertDefaults(valResp);
    expect(valResp.data).toStrictEqual({
      a1: 'a1-default',
      b1: true,
      c1: [1, 2, 3],
      d1: {
        a0: 1,
      },
    });
  });

  it('Checks update defaults', async () => {
    setPreviousDefaultsObject({
      a1: 'a1-default0',
      b1: true,
      c1: [1, 2, 3],
      d1: {
        a0: 1,
      },
    });
    const valResp = {
      json_schema: def,
      ui_schema: {
        type: '',
        elements: [],
      },
      data: { a1: 'other value', a2: 'hey', c1: [1] },
      valid: false,
      detail: '',
    };
    updateDefaults(valResp);
    // a1 was changed by the user: it does not follow its new default
    expect(valResp.data).toStrictEqual({
      a1: 'other value',
      a2: 'hey',
      c1: [1],
    });
  });

  it('lets untouched values follow their default, keeps what the user changed', () => {
    const schema = (cpus: number | undefined, withNote: boolean) => ({
      type: 'object',
      properties: {
        cpus: { type: 'number', ...(cpus === undefined ? {} : { default: cpus }) },
        ram: { type: 'number', default: 4 },
        opts: { type: 'object', ...(withNote ? { default: { note: 'x' } } : {}) },
      },
    });
    const run = (
      previous: object,
      data: ValidateResponse['data'],
      json_schema: ValidateResponse['json_schema'],
    ) => {
      setPreviousDefaultsObject(previous);
      const valResp = {
        json_schema,
        ui_schema: { type: '', elements: [] },
        data,
        valid: false,
        detail: '',
      };
      const changed = updateDefaults(valResp);
      return { data: valResp.data, changed };
    };

    // default 2 -> 4: an untouched 2 follows, a user's 8 stays
    expect(run({ cpus: 2, ram: 4 }, { cpus: 2, ram: 4 }, schema(4, false))).toStrictEqual({
      data: { cpus: 4, ram: 4 },
      changed: true,
    });
    expect(run({ cpus: 2, ram: 4 }, { cpus: 8, ram: 4 }, schema(4, false))).toStrictEqual({
      data: { cpus: 8, ram: 4 },
      changed: false,
    });
    // default gone: only an untouched value goes with it
    expect(
      run({ cpus: 2, ram: 4 }, { cpus: 2, ram: 4 }, schema(undefined, false)).data,
    ).toStrictEqual({
      ram: 4,
    });
    expect(
      run({ cpus: 2, ram: 4 }, { cpus: 8, ram: 4 }, schema(undefined, false)).data,
    ).toStrictEqual({
      cpus: 8,
      ram: 4,
    });
    // a default that is no object on one side (here: absent before) next to a user's object
    expect(
      run({ ram: 4, opts: null }, { ram: 4, opts: { mine: 1 } }, schema(undefined, true)).data,
    ).toStrictEqual({
      ram: 4,
      opts: { mine: 1 },
    });
  });

  it('Checks update defaults', async () => {
    setPreviousDefaultsObject({
      a1: 'a1-default0',
      b1: true,
      c1: [1, 2, 3],
      d1: {
        a0: 1,
      },
    });
    const valResp = {
      json_schema: def,
      ui_schema: {
        type: '',
        elements: [],
      },
      data: { a1: 'other value', a2: 'hey', c1: [1] },
      valid: false,
      detail: '',
    };
    mergeDefaults(valResp);
    expect(valResp.data).toStrictEqual({
      a1: 'other value',
      a2: 'hey',
      b1: true,
      c1: [1],
      d1: {
        a0: 1,
      },
    });
  });

  it('merges defaults into existing nested objects and array items', () => {
    const valResp = {
      json_schema: {
        type: 'object',
        properties: {
          net: {
            type: 'object',
            properties: { mtu: { type: 'number' }, dhcp: { type: 'boolean', default: true } },
          },
          disks: {
            type: 'array',
            items: { type: 'object', properties: { fs: { type: 'string', default: 'ext4' } } },
          },
        },
      },
      ui_schema: { type: '', elements: [] },
      data: { net: { mtu: 9000 }, disks: [{}, { fs: 'xfs' }] },
      valid: false,
      detail: '',
    };
    const before = valResp.data;
    expect(mergeDefaults(valResp)).toBe(true);
    expect(valResp.data).toStrictEqual({
      net: { mtu: 9000, dhcp: true },
      disks: [{ fs: 'ext4' }, { fs: 'xfs' }],
    });
    // the caller's object is left alone
    expect(before).toStrictEqual({ net: { mtu: 9000 }, disks: [{}, { fs: 'xfs' }] });
    // nothing left to merge
    expect(mergeDefaults(valResp)).toBe(false);
  });

  it('Serializes the loaded data into the initial create YAML (not just schema defaults)', () => {
    // Load-time generated values (e.g. `random_string`) live in the data but
    // have no schema default — they must survive into the seeded YAML.
    const yaml = getInitialCreateYAML({
      a1: 'a1-default',
      identity: { uuid: '4d0cf1e8-0000-4000-8000-6b23268b0d5e' },
    });
    expect(yaml.startsWith('---\n# Automatically generated by VAYS\n\n')).toBe(true);
    expect(yaml).toContain('uuid: 4d0cf1e8-0000-4000-8000-6b23268b0d5e');
    expect(yaml).toContain('a1: a1-default');
  });

  describe('yamlComment (config.json)', () => {
    it('Uses the built-in comment when the config has none', () => {
      cachedConfig.value = { title: 't' };
      expect(DEFAULT_YAML_COMMENT).toBe('Automatically generated by VAYS');
      expect(getInitialCreateYAML({ a: 1 })).toBe(`---\n# ${DEFAULT_YAML_COMMENT}\n\na: 1\n`);
    });

    it('Uses the configured comment', () => {
      cachedConfig.value = { yamlComment: 'Managed by the Example self-service portal' };
      expect(getInitialCreateYAML({ a: 1 })).toBe(
        '---\n# Managed by the Example self-service portal\n\na: 1\n',
      );
    });

    it('Turns a multi-line comment into one comment line per line', () => {
      cachedConfig.value = { yamlComment: 'Generated by VAYS\n\nDo not edit by hand' };
      expect(getInitialCreateYAML({ a: 1 })).toBe(
        '---\n# Generated by VAYS\n#\n# Do not edit by hand\n\na: 1\n',
      );
    });

    it('Omits the comment for an empty string', () => {
      cachedConfig.value = { yamlComment: '' };
      expect(getInitialCreateYAML({ a: 1 })).toBe('---\na: 1\n');
    });
  });
});
