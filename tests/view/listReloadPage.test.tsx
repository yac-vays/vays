import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { invalidateEntityListCache } from '../../src/model/entityList';
import { useInitializeList } from '../../src/view/components/EntityList/utils/useInitializeList';
import { getTestEditRequestContext } from '../testUtils';

const entity = (name: string) => ({ name, link: null, options: {}, perms: ['see'] });
let entities = ['alpha', 'bravo', 'charlie'].map(entity);

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn(async () => {
    const r = {
      status: 200,
      ok: true,
      json: () => Promise.resolve({ hash: 'h', list: entities }),
      clone: () => r,
    };
    return r;
  }) as unknown as typeof fetch;
});

it('stays on the current page when the list is reloaded, or on the last one left', async () => {
  const rc = getTestEditRequestContext(
    'https://yac-reload.example.com',
    'test',
    null,
    'host',
    'create',
  ).rc;
  rc.accessedEntityType!.options = [];
  const hook = renderHook(() => useInitializeList(rc, undefined));
  const names = () => hook.result.current.tableEntries.map((e) => e.entityName);
  const reload = () => act(() => hook.result.current.setReloadCount((c) => c + 1));

  act(() => hook.result.current.setNumResultsPerPage(1));
  await waitFor(() => expect(names()).toEqual(['alpha']));

  act(() => hook.result.current.setCurrPage(3));
  reload();
  await waitFor(() => expect(names()).toEqual(['charlie']));
  expect(hook.result.current.currPage).toBe(3);

  // The entity of the last page is gone.
  entities = entities.slice(0, 2);
  invalidateEntityListCache(rc.yacURL, rc.entityTypeName);
  reload();
  await waitFor(() => expect(names()).toEqual(['bravo']));
  expect(hook.result.current.currPage).toBe(2);
});
