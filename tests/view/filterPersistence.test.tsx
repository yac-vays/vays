import { act, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as notification from '../../src/controller/global/notification';
import { registerNavigationHook } from '../../src/controller/global/url';
import {
  hasActiveFilters,
  loadSearchTerms,
  saveSearchTerms,
} from '../../src/controller/local/Overview/filters';
import iLocalStorage from '../../src/session/persistent/LocalStorage';
import EntityListHeaderCell from '../../src/view/components/EntityList/Header/EntityListHeaderCell';
import { getSearchCallback } from '../../src/view/components/EntityList/utils/searchCallback';
import { useInitializeList } from '../../src/view/components/EntityList/utils/useInitializeList';
import type { RequestContext } from '../../src/utils/types/internal/request';
import { getTestEditRequestContext } from '../testUtils';

const OPTIONS = [
  { name: '#/group', title: 'Group', aliases: {} },
  { name: '#/os', title: 'OS', aliases: {} },
];

// A fresh backend URL per context: the entity list is cached per URL.
let backendNo = 0;
function context(options = OPTIONS): RequestContext {
  const rc = getTestEditRequestContext(
    `https://yac-${backendNo++}.example.com`,
    'test',
    null,
    'host',
    'create',
  ).rc;
  rc.accessedEntityType!.options = options.map((o) => ({ ...o }));
  return rc;
}

const ENTITIES = [
  { name: 'alpha', group: 'isg', os: 'ubuntu' },
  { name: 'bravo', group: 'isg', os: 'debian' },
  { name: 'charlie', group: 'cs', os: 'ubuntu' },
].map((e) => ({
  name: e.name,
  link: null,
  options: { '#/group': e.group, '#/os': e.os },
  perms: ['see', 'edt'],
}));

function response(status: number, body: object) {
  const r = { status, json: () => Promise.resolve(body), clone: () => r };
  return r;
}

/** The list of `host`, and single entities: the ones in ENTITIES exist, others are 404. */
const fetchMock = vi.fn(async (url: string) => {
  if (url.includes('/entity/host?')) return response(200, { hash: 'h', list: ENTITIES });
  const name = decodeURIComponent(url.split('/entity/host/')[1] ?? '');
  return ENTITIES.some((e) => e.name === name)
    ? response(200, { ...ENTITIES[0], name, data: {}, yaml: '', hash: 'h' })
    : response(404, { title: 'Not Found', message: `${name} does not exist` });
});

beforeEach(() => {
  sessionStorage.clear();
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => vi.restoreAllMocks());

describe('stored filters', () => {
  it('are stored by column name and survive changed columns', () => {
    const rc = context();
    saveSearchTerms(rc, ['al', null, 'ubu']);
    expect(loadSearchTerms(rc)).toEqual(['al', null, 'ubu']);

    // Columns reordered and one added: the filters stay with their column.
    rc.accessedEntityType!.options = [
      { name: '#/owner', title: 'Owner', aliases: {} },
      { name: '#/os', title: 'OS', aliases: {} },
      { name: '#/group', title: 'Group', aliases: {} },
    ];
    expect(loadSearchTerms(rc)).toEqual(['al', null, 'ubu', null]);

    // A column that is gone takes its filter with it.
    rc.accessedEntityType!.options = [{ name: '#/group', title: 'Group', aliases: {} }];
    expect(loadSearchTerms(rc)).toEqual(['al', null]);
  });

  it('are per backend and type, and removed when all are empty', () => {
    const a = context();
    const b = context();
    saveSearchTerms(a, [null, 'isg']);
    expect(loadSearchTerms(b)).toEqual([]);
    saveSearchTerms(a, ['', null, '']);
    expect(loadSearchTerms(a)).toEqual([]);
    expect(sessionStorage.length).toBe(0);
  });

  it('are gone after logout', () => {
    const rc = context();
    saveSearchTerms(rc, ['al']);
    iLocalStorage.clearSession();
    expect(loadSearchTerms(rc)).toEqual([]);
  });

  it('are saved while typing in a column', async () => {
    const rc = context();
    const setters = {
      setCurrPage: vi.fn(),
      setLoading: vi.fn(),
      searchTerms: [null, null, null],
      setSearchTerms: vi.fn(),
      setTotalNumResults: vi.fn(),
      setTableEntries: vi.fn(),
    };
    await getSearchCallback(setters, 10, rc)(2)('deb');
    expect(loadSearchTerms(rc)).toEqual([null, null, 'deb']);
    expect(hasActiveFilters(loadSearchTerms(rc))).toBe(true);
  });
});

describe('column search input', () => {
  const cell = (searchTerm: string) => (
    <table>
      <thead>
        <tr>
          <EntityListHeaderCell
            title="Group"
            firstField={false}
            searchable
            searchCallback={() => {}}
            searchTerm={searchTerm}
          />
        </tr>
      </thead>
    </table>
  );

  it('shows a filter set elsewhere and clears it again', () => {
    const { rerender, container } = render(cell('isg'));
    const input = container.querySelector('input')!;
    expect(input.value).toBe('isg');
    expect(input.parentElement!.className).toContain('block'); // search open
    rerender(cell(''));
    expect(input.value).toBe('');
    expect(input.parentElement!.className).toContain('hidden');
  });
});

describe('list with stored filters', () => {
  const load = async (rc: RequestContext, target?: string) => {
    const hook = renderHook(({ t }) => useInitializeList(rc, t), {
      initialProps: { t: target },
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
  };
  const names = (hook: Awaited<ReturnType<typeof load>>) =>
    hook.result.current.tableEntries.map((e) => e.entityName);

  it('restores the filters when coming back to the list', async () => {
    const rc = context();
    saveSearchTerms(rc, [null, 'isg']);
    const hook = await load(rc);
    expect(hook.result.current.searchTerms).toEqual([null, 'isg', null]);
    expect(names(hook)).toEqual(['alpha', 'bravo']);
  });

  it('shows a linked entity that is in the filtered list, keeping the filters', async () => {
    const rc = context();
    saveSearchTerms(rc, [null, 'isg']);
    const info = vi.spyOn(notification, 'showInfo');
    const hook = await load(rc, 'bravo');
    expect(names(hook)).toEqual(['alpha', 'bravo']);
    expect(loadSearchTerms(rc)).toEqual([null, 'isg', null]);
    expect(info).not.toHaveBeenCalled();
  });

  it('removes the filters to show a linked entity they hide, with a way back', async () => {
    const rc = context();
    saveSearchTerms(rc, [null, 'isg']);
    const info = vi.spyOn(notification, 'showInfo');
    const hook = await load(rc, 'charlie');

    expect(names(hook)).toContain('charlie');
    expect(hook.result.current.searchTerms).toEqual([]);
    expect(loadSearchTerms(rc)).toEqual([]);
    expect(info).toHaveBeenCalledTimes(1);
    const [title, detail, link] = info.mock.calls[0];
    expect(title).toContain('charlie');
    expect(detail).toMatch(/filters were removed/);

    // "Restore filters": back to the filtered list (charlie hidden again),
    // without removing them again.
    act(() => link!.onClick());
    await waitFor(() => expect(names(hook)).toEqual(['alpha', 'bravo']));
    expect(loadSearchTerms(rc)).toEqual([null, 'isg', null]);
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('opens the create form for a linked entity that does not exist', async () => {
    const rc = context();
    saveSearchTerms(rc, [null, 'isg']);
    const nav = vi.fn();
    registerNavigationHook(nav);
    renderHook(() => useInitializeList(rc, 'delta'));
    await waitFor(() => expect(nav).toHaveBeenCalledWith('/test/host/create/delta'));
    // The filters are kept for when the user comes back.
    expect(loadSearchTerms(rc)).toEqual([null, 'isg', null]);
  });

  it('keeps the filters for a linked entity the user cannot see', async () => {
    const rc = context();
    saveSearchTerms(rc, [null, 'isg']);
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/entity/host?')
        ? response(200, { hash: 'h', list: ENTITIES })
        : response(403, { title: 'Forbidden', message: 'no' }),
    );
    vi.spyOn(notification, 'showError').mockImplementation(() => {});
    const hook = await load(rc, 'secret');
    expect(names(hook)).toEqual(['alpha', 'bravo']);
    expect(loadSearchTerms(rc)).toEqual([null, 'isg', null]);
  });
});
