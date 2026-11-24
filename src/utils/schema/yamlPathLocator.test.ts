import { describe, expect, it } from 'vitest';
import {
  locateDataPathExact,
  locateInstancePathInYaml,
  nestedObjectAnchors,
} from './yamlPathLocator';

const yamlText = 'owner: bob\ncpus: 4\ndisks:\n  data_gb: 100\n';

const lineOf = (offset: number) => yamlText.slice(0, offset).split('\n').length;

describe('locateDataPathExact', () => {
  it('locates a top-level scalar on its line', () => {
    const range = locateDataPathExact(yamlText, ['cpus']);
    expect(range && lineOf(range.start)).toBe(2);
  });

  it('locates a nested scalar on its line', () => {
    const range = locateDataPathExact(yamlText, ['disks', 'data_gb']);
    expect(range && lineOf(range.start)).toBe(4);
  });

  it('does NOT fall back to an ancestor for a missing key', () => {
    expect(locateDataPathExact(yamlText, ['disks', 'nope'])).toBeNull();
    expect(locateDataPathExact(yamlText, ['nope'])).toBeNull();
  });

  it('returns null for the document root', () => {
    expect(locateDataPathExact(yamlText, [])).toBeNull();
  });

  it('still anchors on a best-effort parse of broken yaml', () => {
    // parseDocument collects syntax errors instead of throwing, so a mid-edit
    // document keeps its glyphs on whatever structure is still recognizable.
    expect(locateDataPathExact('a: [unclosed', ['a'])).not.toBeNull();
  });
});

describe('nestedObjectAnchors', () => {
  const keyOf = (text: string, a: { key: { start: number; end: number } }) =>
    text.slice(a.key.start, a.key.end);

  it('anchors a nested object on its key, with the keys it has', () => {
    const text = 'a: 1\n\nmail:\n  period: 9to5\n\nroot:\n  - x\n';
    const anchors = nestedObjectAnchors(text);
    expect(anchors.map((a) => [keyOf(text, a), a.keys])).toStrictEqual([['mail', ['period']]]);
    expect(text.slice(0, anchors[0].key.start).split('\n').length).toBe(3);
  });

  it('covers flow objects, deeper objects and objects inside list items', () => {
    const text = 'f: {x: 1}\na:\n  b:\n    c: 1\nl:\n  - m:\n      n: 1\n';
    expect(nestedObjectAnchors(text).map((a) => [keyOf(text, a), a.keys])).toStrictEqual([
      ['f', ['x']],
      ['a', ['b']],
      ['b', ['c']],
      ['m', ['n']],
    ]);
  });

  it('ignores entries whose value is not an object', () => {
    expect(nestedObjectAnchors('a: 1\nb: [1]\nc:\n')).toStrictEqual([]);
  });
});

const DOC = `owner: alice
ssh_keys:
  - name: laptop
    key: abc123
  - name: desktop
    key: ssh-ed25519 AAAA
firewall_enabled: true
`;

function slice(range: { start: number; end: number } | null): string | null {
  if (range == null) return null;
  return DOC.slice(range.start, range.end);
}

describe('locateInstancePathInYaml', () => {
  it('locates a nested value inside a sequence item (the ssh_keys.0.key case)', () => {
    expect(slice(locateInstancePathInYaml(DOC, '/ssh_keys/0/key'))).toBe('abc123');
  });

  it('locates top-level scalars and whole sequence items', () => {
    expect(slice(locateInstancePathInYaml(DOC, '/owner'))).toBe('alice');
    expect(slice(locateInstancePathInYaml(DOC, '/ssh_keys/1'))).toContain('name: desktop');
  });

  it('falls back to the closest existing ancestor for a missing leaf', () => {
    const range = locateInstancePathInYaml(DOC, '/ssh_keys/0/nonexistent');
    expect(slice(range)).toContain('name: laptop');
  });

  it('returns null for the document root, unresolvable paths and garbage input', () => {
    expect(locateInstancePathInYaml(DOC, '')).toBeNull();
    expect(locateInstancePathInYaml(DOC, '/no_such_key')).toBeNull();
    expect(locateInstancePathInYaml('{{{ not yaml', '/a')).toBeNull();
  });
});
