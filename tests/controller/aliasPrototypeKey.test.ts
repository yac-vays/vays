/**
 * A column value that equals a key of Object.prototype ("constructor",
 * "toString", "__proto__", ...) is not an alias: the list shows it as the
 * plain text it is and the column search matches against it. (It used to be
 * looked up with `in`, which handed a function to the Markdown renderer and
 * to `.toLowerCase()` — a blank app for everybody opening that list.)
 */
import { describe, expect, it, vi } from 'vitest';
import { getAlias } from '../../src/utils/columnUtils';
import type { EntityObject } from '../../src/utils/types/api';
import { getTestEditRequestContext } from '../testUtils';

const entities: EntityObject[] = [];
vi.mock('../../src/model/entityList', () => ({
  getEntityList: vi.fn(async () => entities),
}));

const { fetchEntities } = await import('../../src/controller/local/Overview/list');
const { performSearch } = await import('../../src/controller/local/Overview/search');

const PROTOTYPE_KEYS = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'];

const entity = (name: string, os: unknown): EntityObject =>
  ({ name, link: null, options: { os }, perms: ['see'] }) as EntityObject;

function requestContext(aliases: { [key: string]: string }) {
  const rc = getTestEditRequestContext('https://yac.example', 'b', null, 'host', 'edit').rc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rc.accessedEntityType as any).options = [{ name: 'os', title: 'OS', aliases }];
  return rc;
}

// Aliases arrive as JSON, like from the backend.
const rc = requestContext(JSON.parse('{"ubuntu": "**Ubuntu**"}'));

describe('column value that is an Object.prototype key', () => {
  it.each(PROTOTYPE_KEYS)('list: %s stays plain text', async (value) => {
    entities.splice(0, entities.length, entity('evil', value));
    const res = await fetchEntities(rc, 10, 0, null);
    expect(res.partialResults[0].elt[1]).toStrictEqual({ value, isMarkdown: false });
  });

  it.each(PROTOTYPE_KEYS)('search: %s is matched as text', (value) => {
    const list = [entity('evil', value), entity('other', 'debian')];
    expect(performSearch(rc, list, [null, value.slice(0, 5).toUpperCase()])).toStrictEqual([
      list[0],
    ]);
    expect(performSearch(rc, list, [null, 'deb'])).toStrictEqual([list[1]]);
  });

  it('real aliases are still used for display and search', async () => {
    entities.splice(0, entities.length, entity('web01', 'ubuntu'));
    const res = await fetchEntities(rc, 10, 0, null);
    expect(res.partialResults[0].elt[1]).toStrictEqual({ value: '**Ubuntu**', isMarkdown: true });
    expect(performSearch(rc, entities, [null, '**ubu'])).toHaveLength(1);
  });

  it('an alias that is not a string is ignored', async () => {
    const odd = requestContext(JSON.parse('{"ubuntu": {"title": "Ubuntu"}, "debian": 12}'));
    entities.splice(0, entities.length, entity('web01', 'ubuntu'), entity('web02', 'debian'));
    const res = await fetchEntities(odd, 10, 0, null);
    expect(res.partialResults.map((r) => r.elt[1])).toStrictEqual([
      { value: 'ubuntu', isMarkdown: false },
      { value: 'debian', isMarkdown: false },
    ]);
    expect(performSearch(odd, entities, [null, 'ubu'])).toStrictEqual([entities[0]]);
  });

  it('getAlias only knows own string entries', () => {
    expect(getAlias({ a: 'A' }, 'a')).toBe('A');
    expect(getAlias({ a: 'A' }, 'b')).toBeNull();
    expect(getAlias({ a: 'A' }, 'constructor')).toBeNull();
    expect(getAlias(JSON.parse('{"__proto__": "P"}'), '__proto__')).toBe('P');
    expect(getAlias(undefined, 'a')).toBeNull();
  });
});
