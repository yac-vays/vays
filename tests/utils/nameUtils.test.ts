import { describe, expect, it } from 'vitest';
import { pathStartsWith } from '../../src/controller/global/url';
import { matchesNamePattern } from '../../src/utils/nameUtils';

describe('matchesNamePattern', () => {
  it('matches the whole name, like the backend', () => {
    expect(matchesNamePattern('web01', '[a-z0-9-]+')).toBe(true);
    expect(matchesNamePattern('Foo bar', '[a-z0-9-]+')).toBe(false);
    expect(matchesNamePattern('ab', 'a|b')).toBe(false);
  });

  it('accepts everything without a pattern or with one JavaScript cannot compile', () => {
    expect(matchesNamePattern('x', undefined)).toBe(true);
    expect(matchesNamePattern('x', '(?P<n>a)')).toBe(true);
  });
});

describe('pathStartsWith', () => {
  it('compares the decoded path', () => {
    expect(pathStartsWith('/my%20be/host/create/a%2Fb', '/my be/host/create')).toBe(true);
    expect(pathStartsWith('/be/host/edit/x', '/be/host/create')).toBe(false);
    expect(pathStartsWith('/be/100%/create', '/be/100%/create')).toBe(true);
  });
});
