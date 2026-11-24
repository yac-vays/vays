import { describe, expect, it } from 'vitest';
import { exampleValueForSchema, fieldHelpHoverMarkdown, subschemaAtPath } from './fieldHelp';
import { valueEditInYaml, yamlPathAtOffset } from './yamlPathLocator';

const schema = {
  type: 'object',
  required: ['owner'],
  properties: {
    owner: { type: 'string', title: 'Owner', description: 'The responsible user.' },
    os: {
      type: 'string',
      oneOf: [{ const: 'linux' }, { const: 'windows', title: 'Windows (special)' }],
    },
    networking: {
      type: 'object',
      properties: { ip: { type: 'string', pattern: '^\\d+\\.', examples: ['10.0.0.1'] } },
    },
    ssh_keys: { type: 'array', items: { type: 'string', title: 'SSH key' } },
  },
};

describe('subschemaAtPath', () => {
  it('resolves plain properties and nested objects', () => {
    expect(subschemaAtPath(schema, ['owner'])?.title).toBe('Owner');
    expect(subschemaAtPath(schema, ['networking', 'ip'])?.pattern).toBe('^\\d+\\.');
  });

  it('resolves array items by index', () => {
    expect(subschemaAtPath(schema, ['ssh_keys', 0])?.title).toBe('SSH key');
  });

  it('searches oneOf/anyOf branches', () => {
    const s = {
      oneOf: [{ type: 'object', properties: { special: { type: 'number', title: 'S' } } }],
    };
    expect(subschemaAtPath(s, ['special'])?.title).toBe('S');
  });

  it('returns null for unknown paths', () => {
    expect(subschemaAtPath(schema, ['nope'])).toBeNull();
  });
});

describe('fieldHelpHoverMarkdown', () => {
  it('renders type and required-ness, but NOT the description (monaco-yaml shows it)', () => {
    const md = fieldHelpHoverMarkdown('owner', schema.properties.owner, schema);
    expect(md).toContain('**Type:** string (required)');
    expect(md).not.toContain('The responsible user.');
  });

  it('collects possible values from oneOf consts with their titles', () => {
    const md = fieldHelpHoverMarkdown('os', schema.properties.os, schema);
    expect(md).toContain('**Possible values:**');
    expect(md).toContain('`"linux"`');
    expect(md).toContain('`"windows"` — Windows (special)');
  });

  it('renders pattern and examples', () => {
    const md = fieldHelpHoverMarkdown('ip', schema.properties.networking.properties.ip);
    expect(md).toContain('**Pattern:** `^\\d+\\.`');
    expect(md).toContain('`"10.0.0.1"`');
  });

  it('is empty when the schema holds no facts (hover section is then omitted)', () => {
    expect(fieldHelpHoverMarkdown('bare', {})).toBe('');
    expect(fieldHelpHoverMarkdown('bare', { description: 'only prose' })).toBe('');
  });
});

describe('yamlPathAtOffset', () => {
  const yaml = 'owner: alice\nnetworking:\n  ip: 10.0.0.1\nssh_keys:\n  - key-one\n  - key-two\n';

  it('resolves an offset on a top-level key', () => {
    expect(yamlPathAtOffset(yaml, yaml.indexOf('owner'))).toEqual(['owner']);
  });

  it('resolves an offset inside a top-level value', () => {
    expect(yamlPathAtOffset(yaml, yaml.indexOf('alice'))).toEqual(['owner']);
  });

  it('resolves an offset on a nested key and value', () => {
    expect(yamlPathAtOffset(yaml, yaml.indexOf('ip:'))).toEqual(['networking', 'ip']);
    expect(yamlPathAtOffset(yaml, yaml.indexOf('10.0.0.1'))).toEqual(['networking', 'ip']);
  });

  it('resolves sequence items to their index', () => {
    expect(yamlPathAtOffset(yaml, yaml.indexOf('key-two'))).toEqual(['ssh_keys', 1]);
  });

  it('returns null outside any entry and for broken documents', () => {
    expect(yamlPathAtOffset('\n\n', 1)).toBeNull();
  });
});

describe('exampleValueForSchema', () => {
  it('prefers example, then default, then first enum value', () => {
    expect(exampleValueForSchema({ type: 'string', examples: ['ex'], default: 'def' })).toBe('ex');
    expect(exampleValueForSchema({ type: 'string', default: 'def' })).toBe('def');
    expect(exampleValueForSchema({ type: 'string', enum: ['a', 'b'] })).toBe('a');
  });

  it('stubs objects with required properties and defaulted optionals, recursively', () => {
    const s = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        port: { type: 'integer', default: 8080 },
        note: { type: 'string' },
        nested: {
          type: 'object',
          required: ['ip'],
          default: undefined,
          properties: { ip: { type: 'string', examples: ['10.0.0.1'] } },
        },
      },
    };
    expect(exampleValueForSchema(s)).toEqual({ name: '', port: 8080 });
  });

  it('stubs arrays with one item from the item schema', () => {
    expect(
      exampleValueForSchema({
        type: 'array',
        items: { type: 'object', required: ['key'], properties: { key: { type: 'string' } } },
      }),
    ).toEqual([{ key: '' }]);
  });

  it('uses primitive zero values and oneOf first branches', () => {
    expect(exampleValueForSchema({ type: 'boolean' })).toBe(false);
    expect(exampleValueForSchema({ oneOf: [{ const: 'linux' }] })).toBe('linux');
    expect(exampleValueForSchema({})).toBeUndefined();
  });
});

describe('yamlPathAtOffset', () => {
  const src = 'a: 1\nb: 2\nc:\n  d: 3\n  e: 4\nf: 5\nl:\n  - x: 1\n  - x: 2\n';
  const at = (needle: string) => yamlPathAtOffset(src, src.indexOf(needle));

  it('resolves the first character of a key to that key', () => {
    expect(at('a: 1')).toEqual(['a']);
    expect(at('b: 2')).toEqual(['b']);
    expect(at('d: 3')).toEqual(['c', 'd']);
    expect(at('e: 4')).toEqual(['c', 'e']);
    expect(at('f: 5')).toEqual(['f']);
    expect(at('x: 2')).toEqual(['l', 1, 'x']);
  });

  it('resolves a value to its entry', () => {
    expect(yamlPathAtOffset(src, src.indexOf('4'))).toEqual(['c', 'e']);
  });
});

describe('valueEditInYaml', () => {
  const apply = (src: string, path: (string | number)[], value: unknown) => {
    const edit = valueEditInYaml(src, path, value);
    return edit == null ? null : src.slice(0, edit.start) + edit.text + src.slice(edit.end);
  };

  it('replaces only the value: comments, spacing and long lines stay as they are', () => {
    const long = 'word '.repeat(40).trim();
    const src = `# header\nowner:   alice   # keep me\nlist:\n- a\nnote: ${long}\n`;
    expect(apply(src, ['owner'], 'bob')).toBe(
      `# header\nowner: bob   # keep me\nlist:\n- a\nnote: ${long}\n`,
    );
  });

  it('writes nested structures as an indented block', () => {
    expect(
      apply('net:\n  cfg: x # c\nz: 1\n', ['net', 'cfg'], { ip: '10.0.0.1', vlans: [1] }),
    ).toBe('net:\n  cfg:\n    ip: 10.0.0.1\n    vlans:\n      - 1 # c\nz: 1\n');
    expect(apply('a:\n  b: 1\n  c: 2\nz: 1\n', ['a'], 'x')).toBe('a: x\nz: 1\n');
  });

  it('fills an empty value, a sequence item and a flow entry', () => {
    expect(apply('a:\nb: 1\n', ['a'], 'x')).toBe('a: x\nb: 1\n');
    expect(apply('l:\n  - one\n  - two\n', ['l', 1], { k: 'v', n: 2 })).toBe(
      'l:\n  - one\n  - k: v\n    n: 2\n',
    );
    expect(apply('f: {a: 1, b: 2}\n', ['f', 'b'], 'x y')).toBe('f: {a: 1, b: "x y"}\n');
  });

  it('returns null for missing entries and unparseable documents', () => {
    expect(valueEditInYaml('a: 1\n', ['b'], 1)).toBeNull();
    expect(valueEditInYaml('a: [unclosed', ['a'], 1)).toBeNull();
  });
});
