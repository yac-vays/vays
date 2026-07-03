/**
 * The Overview table has three fetch paths that all write the same table
 * state: the effect loader (useInitializeList), explicit reloads (page flips /
 * refresh) and the column search. They used to carry three INDEPENDENT
 * staleness counters, so a response that was newest within its own path could
 * still overwrite newer content another path had already applied — e.g. a
 * slow page-3 reload landing after a search had filtered the table, leaving
 * the table showing unfiltered page 3 under a filled-in search box.
 *
 * These tests pin the shared list generation: the LAST dispatched fetch wins,
 * regardless of which path the earlier response came from.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSearchCallback } from '../../src/view/components/EntityList/utils/searchCallback';
import { getTestEditRequestContext } from '../testUtils';

// Deferred per-call control over the entity list the fetch paths consume.
const pendingLists: ((entities: unknown[]) => void)[] = [];
vi.mock('../../src/model/entityList', () => ({
  getEntityList: () => new Promise((resolve) => pendingLists.push(resolve)),
  fetchEntityList: async () => ({ ok: true, entities: [] }),
  invalidateEntityListCache: () => {},
}));

// Imported AFTER the mock so list.ts binds the mocked getEntityList.
const { reload } = await import('../../src/controller/local/Overview/list');

function entity(name: string) {
  return { name, link: null, options: {}, perms: ['see'] };
}

function makeHooks() {
  const state = {
    tableEntries: [] as { entityName: string }[],
    loading: false,
    page: 1,
    totalNumResults: 0,
    headers: [] as string[],
    searchTerms: [] as (string | null)[],
  };
  return {
    state,
    handlers: {
      setTableHeaderEntries: (v: string[]) => (state.headers = v),
      setTableEntries: (v: { entityName: string }[]) => (state.tableEntries = v),
      setCurrPage: (v: number) => (state.page = v),
      setLoading: (v: boolean) => (state.loading = v),
    },
    searchHooks: {
      setCurrPage: (v: number) => (state.page = v),
      setLoading: (v: boolean) => (state.loading = v),
      searchTerms: state.searchTerms,
      setSearchTerms: (v: (string | null)[]) => (state.searchTerms = v),
      setTotalNumResults: (v: number) => (state.totalNumResults = v),
      setTableEntries: (v: { entityName: string }[]) => (state.tableEntries = v),
    },
  };
}

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('shared list generation across reload and search', () => {
  beforeEach(() => {
    pendingLists.length = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('a slow reload response does not overwrite a newer search result', async () => {
    const rc = getTestEditRequestContext('https://yac_no_token.com', 'test', null, 't', 'edit').rc;
    const { state, handlers, searchHooks } = makeHooks();

    // 1. User flips to a page -> reload dispatched, response slow.
    const reloadPromise = reload(rc, handlers, 10, false, 3, null);
    await flushMicrotasks();
    expect(pendingLists).toHaveLength(1);
    const answerReload = pendingLists.shift();

    // 2. User types a column search -> debounced fetch dispatches and resolves.
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSearchCallback(searchHooks as any, 10, rc)(0)('needle');
    vi.advanceTimersByTime(400); // past the search debounce
    vi.useRealTimers();
    await flushMicrotasks();
    expect(pendingLists).toHaveLength(1);
    pendingLists.shift()?.([entity('needle-match')]);
    await flushMicrotasks();
    expect(state.tableEntries.map((e) => e.entityName)).toStrictEqual(['needle-match']);

    // 3. The old reload response arrives LAST — it must not overwrite the
    //    (newer) filtered table with unfiltered page-3 content.
    answerReload?.([entity('stale-a'), entity('stale-b')]);
    await reloadPromise;
    expect(state.tableEntries.map((e) => e.entityName)).toStrictEqual(['needle-match']);
  });

  it('within one path the newest dispatch still wins (previous behavior kept)', async () => {
    const rc = getTestEditRequestContext('https://yac_no_token.com', 'test', null, 't', 'edit').rc;
    const { state, handlers } = makeHooks();

    const first = reload(rc, handlers, 10, false, 1, null);
    await flushMicrotasks();
    const answerFirst = pendingLists.shift();
    const second = reload(rc, handlers, 10, false, 1, null);
    await flushMicrotasks();
    pendingLists.shift()?.([entity('newer')]);
    await second;
    answerFirst?.([entity('older')]);
    await first;
    expect(state.tableEntries.map((e) => e.entityName)).toStrictEqual(['newer']);
  });
});
