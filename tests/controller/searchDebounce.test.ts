/**
 * A debounced column search belongs to the list it was typed in: once another
 * table-content dispatch happened (e.g. the list of another entity type
 * started loading), it neither fetches nor invalidates that dispatch.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cancelPendingSearch,
  getSearchCallback,
} from '../../src/view/components/EntityList/utils/searchCallback';
import { getTestEditRequestContext } from '../testUtils';

const getEntityList = vi.fn(async () => []);
vi.mock('../../src/model/entityList', () => ({
  getEntityList: () => getEntityList(),
  fetchEntityList: async () => ({ ok: true, entities: [] }),
  invalidateEntityListCache: () => {},
}));

const { isStaleListGeneration, nextListGeneration } =
  await import('../../src/controller/local/Overview/list');

const rc = getTestEditRequestContext('https://x', 'be', null, 'host', 'edit').rc;
const hooks = () => ({
  setCurrPage: () => {},
  setLoading: () => {},
  searchTerms: [] as (string | null)[],
  setSearchTerms: () => {},
  setTotalNumResults: () => {},
  setTableEntries: () => {},
});

beforeEach(() => {
  vi.useFakeTimers();
  getEntityList.mockClear();
});
afterEach(() => vi.useRealTimers());

test('a search superseded within its debounce does nothing', async () => {
  await getSearchCallback(hooks(), 10, rc)(0)('a');
  const newer = nextListGeneration(); // e.g. the next list starts loading
  await vi.advanceTimersByTimeAsync(1000);
  expect(getEntityList).not.toHaveBeenCalled();
  expect(isStaleListGeneration(newer)).toBe(false);
});

test('an unmounted list cancels its pending search', async () => {
  await getSearchCallback(hooks(), 10, rc)(0)('a');
  cancelPendingSearch();
  await vi.advanceTimersByTimeAsync(1000);
  expect(getEntityList).not.toHaveBeenCalled();
});

test('the last keystroke still searches', async () => {
  const cb = getSearchCallback(hooks(), 10, rc);
  await cb(0)('a');
  await cb(0)('ab');
  await vi.advanceTimersByTimeAsync(1000);
  expect(getEntityList).toHaveBeenCalledTimes(1);
});
