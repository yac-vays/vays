import { describe, expect, it } from 'vitest';
import { fieldHelpHoverMarkdown, subschemaAtPath } from './fieldHelp';
import { yamlPathAtOffset } from './yamlPathLocator';

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
