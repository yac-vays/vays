/**
 * patchSchemaForMonaco: works around the yaml-language-server 1.23 regression
 * where booleans nested in an object `const` are compared as the strings
 * "true"/"false" and the whole const can never match (Monaco flags e.g.
 * `docker_daemon` as "Value must be {…}" for the value it already is).
 * Non-scalar consts are expanded into the exactly-equivalent structural
 * schema; scalar consts and everything else must pass through untouched.
 * (Verified against yaml-language-server 1.23.0 with the real aclabs.ethz.ch
 * schema: the false positive disappears while genuinely wrong/missing values
 * are still flagged — now even on the exact leaf line.)
 */
import { describe, expect, it } from 'vitest';
import { patchSchemaForMonaco } from '../../src/utils/schema/monacoSchemaFix';

describe('patchSchemaForMonaco', () => {
  it('expands an object const (the docker_daemon case) into a structural schema', () => {
    const schema = {
      type: 'object',
      properties: {
        docker_daemon: {
          title: 'Docker Daemon',
          const: { ipv6: true, 'fixed-cidr-v6': 'fc00:d0c0::1/64', 'userland-proxy': false },
        },
      },
    };
    expect(patchSchemaForMonaco(schema)).toStrictEqual({
      type: 'object',
      properties: {
        docker_daemon: {
          title: 'Docker Daemon',
          type: 'object',
          properties: {
            ipv6: { const: true },
            'fixed-cidr-v6': { const: 'fc00:d0c0::1/64' },
            'userland-proxy': { const: false },
          },
          required: ['ipv6', 'fixed-cidr-v6', 'userland-proxy'],
          additionalProperties: false,
        },
      },
    });
  });

  it('expands array consts as exact tuples and recurses into nested objects', () => {
    expect(patchSchemaForMonaco({ const: [{ a: true }, 'x'] })).toStrictEqual({
      type: 'array',
      items: [
        {
          type: 'object',
          properties: { a: { const: true } },
          required: ['a'],
          additionalProperties: false,
        },
        { const: 'x' },
      ],
      minItems: 2,
      maxItems: 2,
    });
  });

  it('rewrites enums with non-scalar members into anyOf', () => {
    expect(patchSchemaForMonaco({ enum: [{ a: 1 }, 'plain'] })).toStrictEqual({
      anyOf: [
        {
          type: 'object',
          properties: { a: { const: 1 } },
          required: ['a'],
          additionalProperties: false,
        },
        { const: 'plain' },
      ],
    });
  });

  it('keeps scalar consts, all-scalar enums and unrelated keywords untouched', () => {
    const schema = {
      type: 'object',
      required: ['x'],
      properties: {
        x: { const: 'scalar', title: 'X' },
        y: { enum: ['a', 'b'], default: 'a' },
        z: { const: null },
        deep: { type: 'object', properties: { inner: { const: true } } },
      },
      oneOf: [{ const: 42 }],
    };
    expect(patchSchemaForMonaco(schema)).toStrictEqual(schema);
  });

  it('does not mutate its input', () => {
    const schema = { properties: { d: { const: { b: true } } } };
    const copy = structuredClone(schema);
    patchSchemaForMonaco(schema);
    expect(schema).toStrictEqual(copy);
  });
});
