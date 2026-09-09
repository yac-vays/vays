/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import {
  EXPLICIT_RENDERERS,
  LintFinding,
  lintSchema,
  MAX_CATEGORIES,
  MAX_FIELDS_PER_CATEGORY,
} from '../../src/utils/schema/schemaLint';

/**
 * Build the json_schema / ui_schema pair YAC would emit for a flat set of
 * properties, all in one category. `vays_options` is moved into the Control's
 * `options`, exactly like YAC's `vays_category` plugin does.
 */
function form(
  properties: { [key: string]: any },
  data: unknown = {},
  required: string[] = Object.keys(properties),
) {
  const json: any = { type: 'object', required, properties: {} };
  const controls: any[] = [];
  for (const [key, schema] of Object.entries(properties)) {
    const { vays_options, ...rest } = schema;
    json.properties[key] = rest;
    controls.push({ type: 'Control', scope: `#/properties/${key}`, options: vays_options ?? {} });
  }
  const ui = {
    type: 'Categorization',
    elements: [{ type: 'Category', label: 'General', elements: controls }],
  };
  return lintSchema(json, ui, data);
}

const titles = (f: LintFinding[]) => f.map((x) => x.title);
const described = (s: any) => ({ description: 'documented', ...s });

describe('schemaLint', () => {
  describe('descriptions', () => {
    it('Flags a missing description on every non-object field (priority 1)', () => {
      const f = form({
        a: { type: 'string', title: 'A' },
        b: { type: 'boolean', title: 'B' },
        c: { type: 'array', items: { type: 'string' } },
        o: { type: 'object', properties: {} },
      });
      const missing = f.filter((x) => x.title === 'No description available');
      expect(missing.map((x) => x.key).sort()).toEqual(['a', 'b', 'c']);
      expect(missing.every((x) => x.priority === 1)).toBe(true);
    });

    it('Is quiet on a fully documented plain field', () => {
      expect(form({ a: described({ type: 'string', title: 'Hostname' }) })).toEqual([]);
    });
  });

  describe('renderer selection', () => {
    it('Flags an unknown renderer name', () => {
      const f = form({ a: described({ type: 'string', vays_options: { renderer: 'textarea' } }) });
      expect(titles(f)).toEqual(['Unknown renderer']);
      expect(f[0].priority).toBe(9);
      expect(f[0].message).toContain(EXPLICIT_RENDERERS.join(', '));
    });

    it('Flags a string renderer on a non-string type', () => {
      const f = form({
        a: described({ type: 'integer', vays_options: { renderer: 'text_area' } }),
      });
      expect(titles(f)).toEqual(['Renderer does not match the type']);
    });

    it('Accepts a string renderer on an untyped field', () => {
      expect(
        form({ a: described({ pattern: '.*', vays_options: { renderer: 'ssh_key' } }) }),
      ).toEqual([]);
    });

    it('Flags an array renderer on a string', () => {
      const f = form({
        a: described({ type: 'string', vays_options: { renderer: 'big_string_list' } }),
      });
      expect(titles(f)).toEqual(['Renderer does not match the type']);
    });

    it('Flags multi_checkbox without uniqueItems', () => {
      const f = form({
        a: described({
          type: 'array',
          items: { enum: ['r', 'w'] },
          vays_options: { renderer: 'multi_checkbox' },
        }),
      });
      expect(titles(f)).toEqual(["Renderer 'multi_checkbox' requires uniqueItems"]);
      expect(
        form({
          a: described({
            type: 'array',
            uniqueItems: true,
            items: { enum: ['r', 'w'] },
            vays_options: { renderer: 'multi_checkbox' },
          }),
        }),
      ).toEqual([]);
    });
  });

  describe('enum / oneOf', () => {
    it('Flags oneOf entries without const', () => {
      const f = form({
        a: described({
          type: 'string',
          oneOf: [{ const: 'x', title: 'X' }, { title: 'Y' }],
        }),
      });
      expect(titles(f)).toEqual(['oneOf entry without const']);
      expect(f[0].priority).toBe(9);
    });

    it('Flags a oneOf with no const at all as not rendered', () => {
      const f = form({
        a: described({ oneOf: [{ type: 'string' }, { type: 'null' }] }),
      });
      expect(titles(f)).toEqual(['oneOf is not rendered as a form control']);
    });

    it('Flags a required single-choice dropdown (priority 2)', () => {
      const f = form({ a: described({ type: 'string', enum: ['only'] }) });
      expect(titles(f)).toEqual(['Single-choice dropdown']);
      // Not required: fine (the user may leave it out).
      expect(form({ a: described({ type: 'string', enum: ['only'] }) }, {}, [])).toEqual([]);
    });
  });

  describe('default / initial', () => {
    it('Flags a default outside the enum', () => {
      const f = form({ a: described({ type: 'string', enum: ['x', 'y'], default: 'z' }) });
      expect(titles(f)).toEqual(['Default value is not an allowed choice']);
      expect(f[0].priority).toBe(7);
    });

    it('Flags a default outside the oneOf consts', () => {
      const f = form({
        a: described({ type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }], default: 'z' }),
      });
      expect(titles(f)).toEqual(['Default value is not an allowed choice']);
    });

    it('Flags a default of the wrong type for any type', () => {
      const f = form({
        s: described({ type: 'string', default: 5 }),
        i: described({ type: 'integer', default: 1.5 }),
        n: described({ type: 'number', default: '1' }),
        b: described({ type: 'boolean', default: 'true' }),
        a: described({ type: 'array', items: { type: 'string' }, default: 'x' }),
        ok1: described({ type: 'integer', default: 3 }),
        ok2: described({ type: ['string', 'null'], default: null }),
      });
      expect(f.map((x) => x.key).sort()).toEqual(['a', 'b', 'i', 'n', 's']);
      expect(f.every((x) => x.title === 'Potentially incorrect type for default value')).toBe(true);
    });

    it('Flags initial on renderers that ignore it', () => {
      const f = form({
        p: described({ type: 'string', vays_options: { renderer: 'password', initial: 'x' } }),
        l: described({
          type: 'array',
          items: { type: 'string' },
          vays_options: { renderer: 'big_string_list', initial: ['x'] },
        }),
        arr: described({ type: 'array', items: { type: 'string' }, vays_options: { initial: [] } }),
      });
      expect(f.map((x) => x.key).sort()).toEqual(['arr', 'l', 'p']);
      expect(f.every((x) => x.title === 'initial is ignored by this renderer')).toBe(true);
    });

    it('Flags an initial of the wrong type', () => {
      const f = form({ a: described({ type: 'boolean', vays_options: { initial: 'yes' } }) });
      expect(titles(f)).toEqual(['Potentially incorrect type for initial value']);
      expect(form({ a: described({ type: 'boolean', vays_options: { initial: true } }) })).toEqual(
        [],
      );
    });

    it('Flags an editable initial shadowed by a default', () => {
      const f = form({
        a: described({
          type: 'string',
          default: 'd',
          vays_options: { initial: 'i', initial_editable: true },
        }),
      });
      expect(titles(f)).toEqual(['Potentially overshadowing editable default']);
    });
  });

  describe('renderer options', () => {
    it('Flags a non-integer rows option on text_area', () => {
      const f = form({
        a: described({
          type: 'string',
          vays_options: { renderer: 'text_area', renderer_options: { rows: '8' } },
        }),
      });
      expect(titles(f)).toEqual(['Potentially incorrect type for rows option']);
    });

    it('Flags plaintext passwords', () => {
      const f = form({
        a: described({
          type: 'string',
          vays_options: {
            renderer: 'password',
            renderer_options: { save_password_as: 'plaintext' },
          },
        }),
      });
      expect(titles(f)).toEqual(['Password stored in plaintext']);
      expect(f[0].priority).toBe(6);
    });

    it('Flags random_string spec errors and a default', () => {
      const f = form({
        fmt: described({
          type: 'string',
          vays_options: { renderer: 'random_string', renderer_options: { format: 'nope' } },
        }),
        cs: described({
          type: 'string',
          vays_options: { renderer: 'random_string', renderer_options: { format: 'custom' } },
        }),
        def: described({
          type: 'string',
          default: 'x',
          vays_options: { renderer: 'random_string' },
        }),
        ok: described({
          type: 'string',
          vays_options: { renderer: 'random_string', renderer_options: { format: 'hex' } },
        }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['fmt', "Invalid renderer_options for renderer 'random_string'"],
        ['cs', "Invalid renderer_options for renderer 'random_string'"],
        ['def', "Renderer 'random_string' with a default"],
      ]);
    });

    it('Flags age_secret without a recipient', () => {
      const f = form({
        a: described({ type: 'string', vays_options: { renderer: 'age_secret' } }),
        ok: described({
          type: 'string',
          vays_options: { renderer: 'age_secret', renderer_options: { age_public_key: 'age1x' } },
        }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['a', "Missing age_public_key for renderer 'age_secret'"],
      ]);
    });

    it('Checks info_box for required / not / description', () => {
      const f = form(
        {
          req: { description: 'd', vays_options: { renderer: 'info_box' } },
          noNot: { description: 'd', vays_options: { renderer: 'info_box' } },
          empty: { not: {}, vays_options: { renderer: 'info_box' } },
          ok: { description: 'd', not: {}, vays_options: { renderer: 'info_box' } },
        },
        {},
        ['req'],
      );
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['req', "Required 'info_box' field"],
        ['noNot', "'info_box' without 'not: {}'"],
        ['empty', "'info_box' without description"],
      ]);
      // Not double-reported as "No description available".
      expect(f.some((x) => x.title === 'No description available')).toBe(false);
    });

    it('Flags a list_as_string pattern that rejects the separator', () => {
      const f = form({
        bad: described({
          type: 'string',
          pattern: '^[a-z]+$',
          vays_options: { renderer: 'list_as_string' },
        }),
        ok: described({
          type: 'string',
          pattern: '^[a-z;]+$',
          vays_options: { renderer: 'list_as_string', renderer_options: { separator: ';' } },
        }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['bad', "Pattern rejects the 'list_as_string' separator"],
      ]);
    });

    it('Validates date renderer ranges', () => {
      const f = form({
        bad: described({
          type: 'string',
          format: 'date',
          vays_options: {
            renderer_options: { enable_range: { from: '2026-01-01', to: '2025-01-01' } },
          },
        }),
        shape: described({
          type: 'string',
          format: 'date',
          vays_options: { renderer_options: { disable_range: { from: '01.01.2026' } } },
        }),
        ok: described({
          type: 'string',
          format: 'date',
          vays_options: {
            renderer_options: { enable_range: { from: '2025-01-01', to: '2026-12-31' } },
          },
        }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['bad', 'Invalid enable_range for the date renderer'],
        ['shape', 'Invalid disable_range for the date renderer'],
      ]);
    });

    it('Flags item_label_prop naming an unknown item property', () => {
      const items = { type: 'object', properties: { name: described({ type: 'string' }) } };
      const f = form({
        bad: described({
          type: 'array',
          items,
          vays_options: { renderer_options: { item_label_prop: 'title' } },
        }),
        ok: described({
          type: 'array',
          items,
          vays_options: { renderer_options: { item_label_prop: 'name' } },
        }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['bad', 'item_label_prop names an unknown property'],
      ]);
    });
  });

  describe('plain-text heuristics', () => {
    it('Flags a password-titled plain text field, but not the password renderer', () => {
      const f = form({
        plain: described({ type: 'string', title: 'Root Password' }),
        hashed: described({
          type: 'string',
          title: 'Root Password',
          vays_options: { renderer: 'password' },
        }),
        flag: described({ type: 'boolean', title: 'SUDO: No Password' }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['plain', 'Potentially unsafe handling of Passwords'],
      ]);
    });

    it('Matches "date" only as a whole word', () => {
      const f = form({
        due: described({ type: 'string', title: 'Due Date' }),
        upd: described({ type: 'string', title: 'Automatic Updates' }),
        fmt: described({ type: 'string', title: 'Start Date', format: 'date' }),
      });
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['due', 'Potentially handling a Date as a String'],
      ]);
    });

    it('Suggests list_as_string for comma-separated single-line values only', () => {
      const f = form(
        {
          a: described({ type: 'string' }),
          notes: described({ type: 'string', vays_options: { renderer: 'text_area' } }),
          multi: described({ type: 'string' }),
        },
        { a: 'one, two, three', notes: 'one, two, three', multi: 'one, two\nthree' },
      );
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['a', 'Potentially having a list as string'],
      ]);
    });
  });

  describe('layout', () => {
    it('Flags too many categories and too many fields per category', () => {
      const json: any = { type: 'object', properties: {} };
      const cats: any[] = [];
      for (let c = 0; c <= MAX_CATEGORIES; c++) {
        cats.push({ type: 'Category', label: `C${c}`, elements: [] });
      }
      for (let i = 0; i <= MAX_FIELDS_PER_CATEGORY; i++) {
        json.properties[`f${i}`] = described({ type: 'string' });
        cats[0].elements.push({ type: 'Control', scope: `#/properties/f${i}`, options: {} });
      }
      const f = lintSchema(json, { type: 'Categorization', elements: cats }, {});
      expect(f.map((x) => [x.key, x.title])).toEqual([
        ['Form', 'Potentially too many categories'],
        ['C0', 'Potentially big category'],
      ]);
    });

    it('Counts fields inside groups', () => {
      const json: any = { type: 'object', properties: {} };
      const group: any = { type: 'Group', label: 'G', elements: [] };
      for (let i = 0; i <= MAX_FIELDS_PER_CATEGORY; i++) {
        json.properties[`f${i}`] = described({ type: 'string' });
        group.elements.push({ type: 'Control', scope: `#/properties/f${i}`, options: {} });
      }
      const ui = {
        type: 'Categorization',
        elements: [{ type: 'Category', label: 'C', elements: [group] }],
      };
      expect(titles(lintSchema(json, ui, {}))).toEqual(['Potentially big category']);
    });
  });

  describe('unrendered properties', () => {
    it('Flags top-level properties without a control, except const / not pins', () => {
      const json: any = {
        type: 'object',
        properties: {
          shown: described({ type: 'string' }),
          hidden: described({ type: 'string' }),
          pinned: described({ type: 'string', const: 'x' }),
          placeholder: { not: {} },
        },
      };
      const ui = {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: 'C',
            elements: [{ type: 'Control', scope: '#/properties/shown', options: {} }],
          },
        ],
      };
      const f = lintSchema(json, ui, {});
      expect(f.map((x) => [x.key, x.title, x.priority])).toEqual([
        ['hidden', 'Property is not shown in the form', 4],
      ]);
    });

    it('Reports a hidden object once and finds nested omissions in detail layouts', () => {
      const f = form({
        gone: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
        cfg: {
          type: 'object',
          properties: { port: described({ type: 'integer' }), host: described({ type: 'string' }) },
          vays_options: {
            detail: {
              type: 'Group',
              label: 'cfg',
              elements: [{ type: 'Control', scope: '#/properties/port', options: {} }],
            },
          },
        },
        rows: described({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: described({ type: 'string' }),
              extra: described({ type: 'string' }),
            },
          },
          vays_options: {
            details: { elements: [{ type: 'Control', scope: '#/properties/name' }] },
          },
        }),
      });
      // `gone` itself has a control (it is a top-level property in `form`), so
      // it is descended into and fully covered; only the detail/details omissions remain.
      expect(
        f.filter((x) => x.title === 'Property is not shown in the form').map((x) => x.key),
      ).toEqual(['cfg.host', 'rows[].extra']);
    });
  });

  describe('traversal', () => {
    it('Reports an unresolvable scope as an empty schema', () => {
      const json = { type: 'object', properties: {} };
      const ui = {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: 'C',
            elements: [{ type: 'Control', scope: '#/properties/gone', options: {} }],
          },
        ],
      };
      const f = lintSchema(json, ui, {});
      expect(f.map((x) => [x.key, x.title, x.priority])).toEqual([
        ['gone', 'Empty schema to be rendered', 9],
      ]);
    });

    it('Descends into nested objects (with and without a detail layout)', () => {
      const f = form({
        net: {
          type: 'object',
          properties: {
            ipv4: { type: 'string', title: 'IPv4' },
            deep: { type: 'object', properties: { mac: { type: 'string' } } },
          },
        },
        cfg: {
          type: 'object',
          properties: { port: { type: 'integer', default: 'x' } },
          vays_options: {
            detail: {
              type: 'Group',
              label: 'cfg',
              elements: [{ type: 'Control', scope: '#/properties/port', options: {} }],
            },
          },
        },
      });
      expect(f.map((x) => [x.key, x.title]).sort()).toEqual(
        [
          ['net.ipv4', 'No description available'],
          ['net.deep.mac', 'No description available'],
          ['cfg.port', 'No description available'],
          ['cfg.port', 'Potentially incorrect type for default value'],
        ].sort(),
      );
    });

    it('Descends into array rows and honours their vays_options', () => {
      const f = form({
        users: described({
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'secret'],
            properties: {
              name: described({ type: 'string' }),
              secret: described({ type: 'string' }),
              note: { type: 'string' },
            },
          },
          vays_options: {
            details: {
              elements: [
                { type: 'Control', scope: '#/properties/name' },
                {
                  type: 'Control',
                  scope: '#/properties/secret',
                  options: { renderer: 'age_secret' },
                },
                { type: 'Control', scope: '#/properties/note' },
              ],
            },
          },
        }),
        tags: described({
          type: 'array',
          items: { type: 'string' },
          vays_options: {
            details: { elements: [{ type: 'Control', scope: '#', options: { renderer: 'nope' } }] },
          },
        }),
      });
      expect(f.map((x) => [x.key, x.title]).sort()).toEqual(
        [
          ['users[].secret', "Missing age_public_key for renderer 'age_secret'"],
          ['users[].note', 'No description available'],
          ['tags[]', 'Unknown renderer'],
          ['tags[]', 'No description available'],
        ].sort(),
      );
    });

    it('Does not report a nested property twice when it also has its own Control', () => {
      const json: any = {
        type: 'object',
        properties: {
          net: { type: 'object', properties: { ipv4: { type: 'string' } } },
        },
      };
      const ui = {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: 'C',
            elements: [
              { type: 'Control', scope: '#/properties/net', options: {} },
              { type: 'Control', scope: '#/properties/net/properties/ipv4', options: {} },
            ],
          },
        ],
      };
      const f = lintSchema(json, ui, {});
      expect(f.map((x) => x.key)).toEqual(['net.ipv4']);
    });
  });
});
