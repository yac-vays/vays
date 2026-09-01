import { describe, expect, it } from 'vitest';
import { locateDataPathExact } from './yamlPathLocator';

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
