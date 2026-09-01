import { describe, expect, it } from 'vitest';
import {
  formatLimitLong,
  formatLimitShort,
  limitLevel,
  limitMatchesFormPath,
  limitMatchesYamlPath,
  limitPathSegments,
  metaPanelUsages,
  usagesForFormPath,
} from './limitUtils';
import { LimitUsage } from './types/api';

const usage = (over: Partial<LimitUsage>): LimitUsage => ({
  title: 'cpus',
  used: 3,
  max: 5,
  ok: true,
  ...over,
});

describe('limitLevel', () => {
  it('is over whenever the backend says not ok', () => {
    expect(limitLevel(usage({ ok: false }))).toBe('over');
    expect(limitLevel(usage({ ok: false, used: 0 }))).toBe('over');
  });

  it('is near from 80% usage on (boundary inclusive)', () => {
    expect(limitLevel(usage({ used: 4, max: 5 }))).toBe('near');
    expect(limitLevel(usage({ used: 5, max: 5 }))).toBe('near');
    expect(limitLevel(usage({ used: 3.9, max: 5 }))).toBe('ok');
  });

  it('never divides by a non-positive max', () => {
    expect(limitLevel(usage({ used: 0, max: 0 }))).toBe('ok');
  });
});

describe('formatting', () => {
  it('renders the compact and spelled-out forms', () => {
    expect(formatLimitShort(usage({}))).toBe('3/5');
    expect(formatLimitLong(usage({}))).toBe('cpus: 3 of 5 used');
  });

  it('keeps fractional quota values as-is', () => {
    expect(formatLimitShort(usage({ used: 2.5, max: 7.5 }))).toBe('2.5/7.5');
  });
});

describe('path matching', () => {
  it('splits data-locs, dropping the root marker and empty segments', () => {
    expect(limitPathSegments('#/a/b')).toEqual(['a', 'b']);
    expect(limitPathSegments('#/a')).toEqual(['a']);
    // Lenient: a bare loc without the root marker still resolves.
    expect(limitPathSegments('a/b')).toEqual(['a', 'b']);
    expect(limitPathSegments('#/')).toEqual([]);
    expect(limitPathSegments('')).toEqual([]);
  });

  it('matches form paths only exactly', () => {
    expect(limitMatchesFormPath('#/cpus', 'cpus')).toBe(true);
    expect(limitMatchesFormPath('#/a/b', 'a.b')).toBe(true);
    expect(limitMatchesFormPath('#/a', 'a.b')).toBe(false);
    expect(limitMatchesFormPath('#/a/b', 'a')).toBe(false);
    expect(limitMatchesFormPath('#/', 'a')).toBe(false);
  });

  it('matches yaml paths with numeric segments stringified', () => {
    expect(limitMatchesYamlPath('#/a/b', ['a', 'b'])).toBe(true);
    expect(limitMatchesYamlPath('#/a/0', ['a', 0])).toBe(true);
    expect(limitMatchesYamlPath('#/a', ['a', 'b'])).toBe(false);
  });
});

describe('usage distribution', () => {
  const schema = {
    type: 'object',
    properties: {
      cpus: { type: 'number' },
      disks: { type: 'object', properties: { data_gb: { type: 'number' } } },
    },
  };
  const anchored = usage({ title: 'cpus', path: '#/cpus' });
  const nested = usage({ title: 'disk', path: '#/disks/data_gb' });
  const pathless = usage({ title: 'count', path: null });
  const typo = usage({ title: 'typo', path: '#/cpuz' });

  it('anchors usages on their form field', () => {
    expect(usagesForFormPath([anchored, nested, pathless], 'cpus')).toEqual([anchored]);
    expect(usagesForFormPath([anchored, nested], 'disks.data_gb')).toEqual([nested]);
    expect(usagesForFormPath([anchored], undefined)).toEqual([]);
  });

  it('sends path-less and unresolvable-path usages to the meta panel', () => {
    expect(metaPanelUsages([anchored, nested, pathless, typo], schema)).toEqual([pathless, typo]);
  });

  it('treats a missing path key like null (older backends)', () => {
    expect(metaPanelUsages([usage({})], schema)).toEqual([usage({})]);
  });
});
