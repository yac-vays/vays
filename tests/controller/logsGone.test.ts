import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RequestContext } from '../../src/utils/types/internal/request';

vi.mock('../../src/controller/global/notification', () => ({ showError: vi.fn() }));
vi.mock('../../src/controller/global/availability', () => ({ reportResponse: vi.fn() }));

const { getEntityLogs, invalidateLogCache } = await import('../../src/model/logs');
const { showError } = await import('../../src/controller/global/notification');
const { registerEntityListInvalidationHook } = await import('../../src/model/entityList');

const RC = { yacURL: 'https://yac.example.com', entityTypeName: 'host' } as RequestContext;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it('reloads the list once when the logs of an entity answer 404, not on every poll', async () => {
  const reloadList = vi.fn();
  registerEntityListInvalidationHook(RC.yacURL, RC.entityTypeName, reloadList);
  fetchMock.mockImplementation(async () => new Response('{}', { status: 404 }));

  await getEntityLogs('web01', RC);
  await getEntityLogs('web01', RC);
  expect(reloadList).toHaveBeenCalledTimes(1);

  // Back (e.g. created again) and gone again: reported anew.
  fetchMock.mockImplementationOnce(async () => new Response('[]', { status: 200 }));
  await getEntityLogs('web01', RC);
  invalidateLogCache('web01', RC);
  await getEntityLogs('web01', RC);
  expect(reloadList).toHaveBeenCalledTimes(2);
});

it('toasts a failed fetch only when it is not a background poll', async () => {
  fetchMock.mockImplementation(async () => new Response('{}', { status: 500 }));

  expect(await getEntityLogs('web02', RC, true)).toBeNull();
  expect(showError).not.toHaveBeenCalled();

  expect(await getEntityLogs('web02', RC)).toBeNull();
  expect(showError).toHaveBeenCalledTimes(1);
});
