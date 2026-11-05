import { render } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import iLocalStorage from '../../src/session/persistent/LocalStorage';
import iSessionStorage from '../../src/session/storage/SessionStorage';
import EntityList from '../../src/view/components/EntityList';
import { getSearchCallback } from '../../src/view/components/EntityList/utils/searchCallback';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

const LIST_WITH_OU = {
  hash: '4d6864798cd156ab3011da35b8ff9ecdde34d343',
  list: [
    {
      name: 'host-alpha',
      link: null,
      options: {
        ou: 'D-INFK',
      },
      perms: ['edt', 'see'],
    },
    {
      name: 'host-beta',
      link: null,
      options: {
        ou: 'D-MATH',
      },
      perms: ['edt', 'see'],
    },
  ],
};

function getHostRequestContext(yacURL = 'https://fantasyurl-for-vays.com', entityType = 'hosts') {
  const ctx = getTestEditRequestContext(yacURL, 'test', null, entityType, 'edit');
  if (ctx.rc.accessedEntityType) {
    ctx.rc.accessedEntityType.options = [
      {
        name: 'ou',
        title: 'OU',
        aliases: {},
      },
    ];
  }
  return ctx.rc;
}

describe('EntityList filter persistence across navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('stores and retrieves filters per backend and entity type in sessionStorage', () => {
    const urlA = 'https://backend-a.example.com';
    const urlB = 'https://backend-b.example.com';

    expect(iSessionStorage.getEntityListFilters(urlA, 'hosts')).toEqual([]);

    iSessionStorage.setEntityListFilters(urlA, 'hosts', [null, 'D-INFK']);
    expect(iSessionStorage.getEntityListFilters(urlA, 'hosts')).toEqual([null, 'D-INFK']);
    expect(iSessionStorage.getEntityListFilters(urlA, 'networks')).toEqual([]);
    expect(iSessionStorage.getEntityListFilters(urlB, 'hosts')).toEqual([]);

    // Clearing all filters removes the sessionStorage entry
    iSessionStorage.setEntityListFilters(urlA, 'hosts', [null, '']);
    expect(iSessionStorage.getEntityListFilters(urlA, 'hosts')).toEqual([]);
  });

  it('clears persisted filters on logout via clearSession()', () => {
    const url = 'https://backend-a.example.com';
    iSessionStorage.setEntityListFilters(url, 'hosts', ['alpha']);
    expect(iSessionStorage.getEntityListFilters(url, 'hosts')).toEqual(['alpha']);

    iLocalStorage.clearSession();
    expect(iSessionStorage.getEntityListFilters(url, 'hosts')).toEqual([]);
  });

  it('persists search terms via getSearchCallback and restores them when EntityList remounts', async () => {
    //@ts-expect-error The method has been injected above.
    global.fetch.mockResolvedValue(createFetchResponse(LIST_WITH_OU));

    const rc = getHostRequestContext();
    const state = {
      currPage: 1,
      loading: false,
      searchTerms: [] as (string | null)[],
      totalNumResults: 0,
      tableEntries: [] as unknown[],
    };

    const callback = getSearchCallback(
      {
        setCurrPage: (v) => (state.currPage = v),
        setLoading: (v) => (state.loading = v),
        searchTerms: state.searchTerms,
        setSearchTerms: (v) => (state.searchTerms = v),
        setTotalNumResults: (v) => (state.totalNumResults = v),
        setTableEntries: (v) => (state.tableEntries = v),
      },
      10,
      rc,
    );

    // Filter column 1 (OU) by 'D-INFK'
    await callback(1)('D-INFK');
    expect(iSessionStorage.getEntityListFilters(rc.yacURL, rc.entityTypeName)).toEqual([
      null,
      'D-INFK',
    ]);

    // Simulate returning from host edit view by mounting a fresh EntityList
    const container = document.createElement('div');
    render(<EntityList requestContext={rc} />, container);

    await new Promise((res) => setTimeout(res, 500));

    // Only host-alpha (D-INFK) should be rendered; host-beta (D-MATH) is filtered out
    expect(container.textContent).toContain('host-alpha');
    expect(container.textContent).not.toContain('host-beta');

    // The OU header input should be open and pre-populated with 'D-INFK'
    const inputs = Array.from(container.querySelectorAll('thead input'));
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    expect((inputs[1] as HTMLInputElement).value).toBe('D-INFK');
  });
});
