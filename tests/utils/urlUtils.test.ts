import { describe, expect, it } from 'vitest';
import { entityPath, joinUrl } from '../../src/utils/urlUtils';

describe('entityPath', () => {
  it('joins the segments below /entity', () => {
    expect(entityPath('host')).toBe('/entity/host');
    expect(entityPath('host', 'web01.example.com', 'logs', 'install', 'content')).toBe(
      '/entity/host/web01.example.com/logs/install/content',
    );
  });

  it('keeps a name from adding path segments, a query or a fragment', () => {
    expect(entityPath('host', '../other/name')).toBe('/entity/host/..%2Fother%2Fname');
    expect(entityPath('host', 'a?force=true&run=wipe')).toBe(
      '/entity/host/a%3Fforce%3Dtrue%26run%3Dwipe',
    );
    expect(entityPath('host', 'a#b', 'run', 'x/y')).toBe('/entity/host/a%23b/run/x%2Fy');
    expect(joinUrl('https://yac.example.com/', entityPath('host', 'a b'))).toBe(
      'https://yac.example.com/entity/host/a%20b',
    );
  });
});
