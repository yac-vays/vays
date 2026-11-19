import { describe, expect, it } from 'vitest';
import {
  blockingRegion,
  commentRegions,
  edgeRegion,
  fixedValueRegions,
  LockedRegion,
  startsComment,
} from '../../src/utils/schema/lockedRegions';

const text = (yaml: string, r: LockedRegion) => yaml.slice(r.start, r.end);

describe('fixed values', () => {
  const schema = {
    type: 'object',
    required: ['users_ou'],
    properties: {
      users_ou: { const: 'ISG' }, // pinned by YAC (no write permission)
      legacy: { const: 'keep' }, // optional: may be removed
      owner: { type: 'string' },
      os: { type: 'string', oneOf: [{ const: 'ubuntu', title: 'Ubuntu' }] }, // a choice, not fixed
      net: {
        type: 'object',
        required: ['vlan'],
        properties: { vlan: { const: 12 }, ip: { type: 'string' } },
      },
      users: {
        type: 'array',
        items: {
          type: 'object',
          required: ['uid'],
          properties: { uid: { const: 1000 }, name: { type: 'string' } },
        },
      },
      groups: { const: ['a', 'b'] }, // a whole fixed list
    },
  };
  const yaml = `users_ou: ISG  # the OU
legacy: keep
owner: alice
os: ubuntu
net:
  vlan: 12
  ip: 10.0.0.1
users:
  - uid: 1000
    name: bob
groups:
  - a
  - b
`;

  it('finds the values whose schema is a const, required or not', () => {
    const regions = fixedValueRegions(yaml, schema);
    expect(regions.map((r) => [r.kind, text(yaml, r)])).toEqual([
      ['fixed', 'users_ou: ISG'],
      ['fixed-optional', 'legacy: keep'],
      ['fixed', 'vlan: 12'],
      ['fixed', 'uid: 1000'],
      ['fixed-optional', 'groups:\n  - a\n  - b\n'],
    ]);
  });

  it('has nothing without schema or with broken YAML', () => {
    expect(fixedValueRegions(yaml, null)).toEqual([]);
    expect(fixedValueRegions('a: [', schema)).toEqual([]);
  });
});

describe('comments', () => {
  const yaml = `# header
owner: alice  # the owner
color: '#fff'
tag: a#b
script: |
  # not a comment, part of the text
  echo hi
# trailing
`;

  it('are found from the CST, standalone or after a value', () => {
    const regions = commentRegions(yaml);
    expect(regions.map((r) => [text(yaml, r), r.standalone])).toEqual([
      ['# header', true],
      ['# the owner', false],
      ['# trailing', true],
    ]);
  });

  it('start with # after whitespace, outside quoted and block texts', () => {
    const at = (needle: string, yamlText = yaml) => yamlText.indexOf(needle);
    expect(startsComment(yaml, at('alice') + 'alice'.length + 1)).toBe(true); // "alice |#"
    expect(startsComment(yaml, at('#fff'))).toBe(false); // in quotes
    expect(startsComment(yaml, at('#b'))).toBe(false); // no whitespace before
    expect(startsComment(yaml, at('# not a comment'))).toBe(false); // block scalar
    expect(startsComment('a: 1\n', 5)).toBe(true); // a new line
  });
});

describe('edits', () => {
  const yaml = 'ou: ISG  # x\nowner: alice\n# keep\n';
  const fixed: LockedRegion = { kind: 'fixed', start: 0, end: 7 }; // "ou: ISG"
  const inline: LockedRegion = { kind: 'comment', start: 9, end: 12, standalone: false };
  const standalone: LockedRegion = { kind: 'comment', start: 26, end: 32, standalone: true };
  const optional: LockedRegion = { kind: 'fixed-optional', start: 13, end: 25 };
  const regions = [fixed, inline, optional, standalone];

  it('blocks a cursor strictly inside, but not at the edges', () => {
    expect(blockingRegion(regions, 4, 4, false)).toBe(fixed);
    expect(blockingRegion(regions, 7, 7, false)).toBeNull(); // end of the value: Enter adds a line
    expect(blockingRegion(regions, 0, 0, false)).toBeNull();
    expect(blockingRegion(regions, 11, 11, false)).toBe(inline);
    expect(blockingRegion(regions, 20, 20, false)).toBeNull(); // optional fixed values are not blocked
  });

  it('blocks selections touching a region, except whole lines with inline comments', () => {
    expect(blockingRegion(regions, 5, 10, false)).toBe(fixed);
    expect(blockingRegion(regions, 8, 13, false)).toBe(inline);
    // deleting the whole line "ou: ISG  # x" still hits the fixed value
    expect(blockingRegion(regions, 0, 13, true)).toBe(fixed);
    // whole lines with only an inline comment of a free key: allowed
    expect(blockingRegion([{ ...inline, start: 15, end: 20 }], 13, 21, true)).toBeNull();
    // a standalone comment line can not be deleted
    expect(blockingRegion(regions, 26, 33, true)).toBe(standalone);
    expect(yaml.slice(standalone.start, standalone.end)).toBe('# keep');
  });

  it('refuses only keys that would change a region at its edge', () => {
    expect(edgeRegion(regions, 7, 'x')).toBe(fixed); // appending to the value
    expect(edgeRegion(regions, 7, 'Backspace')).toBe(fixed);
    expect(edgeRegion(regions, 7, 'Enter')).toBeNull();
    expect(edgeRegion(regions, 0, 'Delete')).toBe(fixed);
    expect(edgeRegion(regions, 0, 'ArrowLeft')).toBeNull();
    expect(edgeRegion(regions, 12, 'Enter')).toBeNull(); // after the inline comment
    expect(edgeRegion(regions, 12, 'a')).toBe(inline);
  });
});
