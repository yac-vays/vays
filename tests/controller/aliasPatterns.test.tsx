/**
 * `alias_patterns`: one alias for all values of a column matching a regular
 * expression (e.g. one logo for every `ubuntu-*`), with a plain-text tooltip
 * built from the capture groups. Exact `aliases` keep precedence.
 */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ALIAS_PATTERN_MAX_VALUE_LENGTH, resolveAlias } from '../../src/utils/columnUtils';
import type { AliasPatternDecl, EntityObject } from '../../src/utils/types/api';
import EntityListRow from '../../src/view/components/EntityList/Body/EntityListRow';
import { getTestEditRequestContext } from '../testUtils';

const entities: EntityObject[] = [];
vi.mock('../../src/model/entityList', () => ({
  getEntityList: vi.fn(async () => entities),
}));

const { fetchEntities } = await import('../../src/controller/local/Overview/list');
const { performSearch } = await import('../../src/controller/local/Overview/search');

const PATTERNS: AliasPatternDecl[] = [
  { match: 'ubuntu-(\\d+)\\.(\\d+)', alias: '**U**', tooltip: 'Ubuntu {1}.{2}' },
  { match: 'ubuntu-.*', alias: '**U**' },
  { match: 'windows-srv(\\d{4})', alias: '**W**', tooltip: 'Windows Server {1}' },
  { match: 'windows-(\\d+)', alias: '**W**', tooltip: 'Windows {1}{2}' },
  { match: 'talos-.*', alias: '**T**', tooltip: '' },
];
const option = { aliases: { 'ubuntu-lts': '**LTS**' }, alias_patterns: PATTERNS };

const entity = (name: string, os: unknown): EntityObject =>
  ({ name, link: null, options: { os }, perms: ['see'] }) as EntityObject;

function requestContext(opt: object) {
  const rc = getTestEditRequestContext('https://yac.example', 'b', null, 'host', 'edit').rc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rc.accessedEntityType as any).options = [{ name: 'os', title: 'OS', ...opt }];
  return rc;
}

describe('resolveAlias', () => {
  it('prefers exact aliases, then the first matching pattern', () => {
    expect(resolveAlias(option, 'ubuntu-lts')).toStrictEqual({ alias: '**LTS**', tooltip: null });
    expect(resolveAlias(option, 'ubuntu-24.04')).toStrictEqual({
      alias: '**U**',
      tooltip: 'Ubuntu 24.04',
    });
    // No tooltip given: the value itself.
    expect(resolveAlias(option, 'ubuntu-latest')).toStrictEqual({
      alias: '**U**',
      tooltip: 'ubuntu-latest',
    });
    expect(resolveAlias(option, 'windows-srv2025')?.tooltip).toBe('Windows Server 2025');
    // A missing group is empty.
    expect(resolveAlias(option, 'windows-11')?.tooltip).toBe('Windows 11');
    // An empty tooltip is none.
    expect(resolveAlias(option, 'talos-1.12.2')).toStrictEqual({ alias: '**T**', tooltip: null });
  });

  it('matches the whole value only', () => {
    expect(resolveAlias(option, 'xubuntu-24.04')).toBeNull();
    expect(resolveAlias(option, 'windows-11-old')).toBeNull();
    expect(
      resolveAlias({ aliases: {}, alias_patterns: [{ match: 'a|b', alias: 'X' }] }, 'ab'),
    ).toBeNull();
    expect(
      resolveAlias({ aliases: {}, alias_patterns: [{ match: 'a|b', alias: 'X' }] }, 'b'),
    ).not.toBeNull();
  });

  it('works without patterns (older YAC) and skips broken ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveAlias({ aliases: {} }, 'ubuntu-24.04')).toBeNull();
    const odd = JSON.parse(
      '{"aliases": {}, "alias_patterns": [{"match": "ubuntu-("}, {"match": "(", "alias": "X"},' +
        ' null, {"match": 1, "alias": "Y"}, {"match": "ubuntu-.*", "alias": "U", "tooltip": 5}]}',
    );
    expect(resolveAlias(odd, 'ubuntu-24.04')).toStrictEqual({
      alias: 'U',
      tooltip: 'ubuntu-24.04',
    });
    expect(warn).toHaveBeenCalledOnce();
    expect(
      resolveAlias(JSON.parse('{"aliases": {}, "alias_patterns": {"match": ".*"}}'), 'x'),
    ).toBeNull();
    warn.mockRestore();
  });

  it('does not test overlong values (catastrophic patterns)', () => {
    const evil = { aliases: {}, alias_patterns: [{ match: '(a+)+', alias: 'X' }] };
    const long = 'a'.repeat(ALIAS_PATTERN_MAX_VALUE_LENGTH + 1);
    const start = Date.now();
    expect(resolveAlias(evil, long + '!')).toBeNull();
    expect(Date.now() - start).toBeLessThan(100);
    expect(resolveAlias(evil, 'aaa')).not.toBeNull();
    expect(resolveAlias({ aliases: { [long]: 'L' }, alias_patterns: [] }, long)?.alias).toBe('L');
  });

  it('caches per value and pattern list', () => {
    const patterns = [{ match: 'v-(.*)', alias: 'V' }];
    const exec = vi.spyOn(RegExp.prototype, 'exec');
    resolveAlias({ aliases: {}, alias_patterns: patterns }, 'v-1');
    resolveAlias({ aliases: {}, alias_patterns: patterns }, 'v-1');
    resolveAlias({ aliases: {}, alias_patterns: patterns }, 'w');
    resolveAlias({ aliases: {}, alias_patterns: patterns }, 'w');
    // Only the rule's own regex (the tooltip `replace` uses `exec` too).
    const ruleCalls = exec.mock.contexts.filter((re) => (re as RegExp).source === '^(?:v-(.*))$');
    expect(ruleCalls).toHaveLength(2);
    exec.mockRestore();
  });
});

describe('list and search', () => {
  const rc = requestContext(option);

  it('list shows the alias with its tooltip', async () => {
    entities.splice(
      0,
      entities.length,
      entity('a', 'ubuntu-24.04'),
      entity('b', 'ubuntu-lts'),
      entity('c', 'debian-13'),
    );
    const res = await fetchEntities(rc, 10, 0, null);
    expect(res.partialResults.map((r) => r.elt[1])).toStrictEqual([
      { value: '**U**', isMarkdown: true, tooltip: 'Ubuntu 24.04' },
      { value: '**LTS**', isMarkdown: true },
      { value: 'debian-13', isMarkdown: false },
    ]);
  });

  it('search matches the value, the alias and the tooltip', () => {
    const list = [
      entity('a', 'ubuntu-24.04'),
      entity('b', 'windows-srv2022'),
      entity('c', 'debian-13'),
    ];
    const found = (q: string) => performSearch(rc, list, [null, q]).map((e) => e.name);
    expect(found('24.04')).toStrictEqual(['a']);
    expect(found('UBUNTU-2')).toStrictEqual(['a']);
    expect(found('server')).toStrictEqual(['b']);
    expect(found('**w')).toStrictEqual(['b']);
    expect(found('deb')).toStrictEqual(['c']);
    expect(found('')).toStrictEqual(['a', 'b', 'c']);
    expect(found('nothing')).toStrictEqual([]);
  });
});

describe('tooltip rendering', () => {
  it('is plain text, never markup', () => {
    const rc = requestContext(option);
    const tooltip = '<img src=x onerror=alert(1)> **bold**';
    const { container } = render(
      <table>
        <tbody>
          <EntityListRow
            entryValues={[
              { value: 'host', isMarkdown: false },
              { value: '**U**', isMarkdown: true, tooltip },
              { value: 'Actions', isMarkdown: false },
            ]}
            requestContext={rc}
            link={null}
            actionPair={{ favActs: [], dropdownActs: [] }}
            links={{}}
            entityName="host"
          />
        </tbody>
      </table>,
    );
    const cell = container.querySelectorAll('td')[1];
    expect(cell.querySelector('div[title]')?.getAttribute('title')).toBe(tooltip);
    expect(cell.querySelector('.sr-only')?.textContent).toBe(tooltip);
    expect(cell.querySelector('img')).toBeNull();
    expect(cell.querySelector('strong')?.textContent).toBe('U');
  });
});
