import { describe, expect, it } from 'vitest';
import { setPreviousDefaultsObject } from '../../src/controller/local/EditController/shared';
import {
  insertDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../src/utils/schema/defaultsHandling';
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
    expect(valResp.data).toStrictEqual({
      a1: 'a1-default',
      a2: 'hey',
      c1: [1],
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
});
