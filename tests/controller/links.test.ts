import { expect, test, vi } from 'vitest';
import { fetchEntities, getHeaderEntries } from '../../src/controller/local/Overview/list';
import { numTrailingColumns } from '../../src/utils/columnUtils';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

const URL = 'https://yac_no_token.com';

function linkedContext(withLogs: boolean) {
  const rc = getTestEditRequestContext(URL, 'test', null, 'testType', 'create').rc;
  const t = rc.accessedEntityType;
  if (t == undefined) throw new Error('test context without type');
  t.links = [
    { name: 'repo', title: 'GitLab', icon: '<svg/>' },
    { name: 'dash', title: 'Grafana', icon: '<svg/>' },
  ];
  if (withLogs) {
    t.logs = [{ name: 'l', title: 'L', progress: false, problem: false }];
  }
  return rc;
}

test('the Links column sits between Status and Actions', () => {
  const plain = getTestEditRequestContext(URL, 'test', null, 'testType', 'create').rc;
  expect(getHeaderEntries(plain)).toEqual(['Name', 'Actions']);
  expect(numTrailingColumns(plain)).toEqual(1);

  expect(getHeaderEntries(linkedContext(false))).toEqual(['Name', 'Links', 'Actions']);
  expect(numTrailingColumns(linkedContext(false))).toEqual(2);

  expect(getHeaderEntries(linkedContext(true))).toEqual(['Name', 'Status', 'Links', 'Actions']);
  expect(numTrailingColumns(linkedContext(true))).toEqual(3);
});

test('the entity links are passed on to the rows', async () => {
  //@ts-expect-error The method has been injected above.
  global.fetch.mockResolvedValue(
    createFetchResponse({
      hash: 'h',
      list: [
        {
          name: 'a',
          link: null,
          options: {},
          links: { repo: 'https://git.example.com/a' },
          perms: ['see'],
        },
        // older YAC versions do not send `links` at all
        { name: 'b', link: null, options: {}, perms: ['see'] },
      ],
    }),
  );

  const res = await fetchEntities(linkedContext(false), 10, 0, []);

  expect(res.partialResults.map((r) => r.links)).toEqual([
    { repo: 'https://git.example.com/a' },
    {},
  ]);
  expect(res.partialResults[0].elt.map((e) => e.value)).toEqual(['a', 'Links', 'Actions']);
});
