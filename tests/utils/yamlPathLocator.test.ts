/**
 * locateInstancePathInYaml: maps a backend error location (YAC `data_loc`,
 * AJV instance-path style) to the character range of the offending value in
 * the YAML text — the basis for showing backend-only validation errors
 * (custom YAC formats like `ssh_key`) as markers in the Monaco editor.
 */
import { describe, expect, it } from 'vitest';
import { locateInstancePathInYaml } from '../../src/utils/schema/yamlPathLocator';

const DOC = `owner: alice
ssh_keys:
  - name: laptop
    key: abc123
  - name: desktop
    key: ssh-ed25519 AAAA
firewall_enabled: true
`;

function slice(range: { start: number; end: number } | null): string | null {
  if (range == null) return null;
  return DOC.slice(range.start, range.end);
}

describe('locateInstancePathInYaml', () => {
  it('locates a nested value inside a sequence item (the ssh_keys.0.key case)', () => {
    expect(slice(locateInstancePathInYaml(DOC, '/ssh_keys/0/key'))).toBe('abc123');
  });

  it('locates top-level scalars and whole sequence items', () => {
    expect(slice(locateInstancePathInYaml(DOC, '/owner'))).toBe('alice');
    expect(slice(locateInstancePathInYaml(DOC, '/ssh_keys/1'))).toContain('name: desktop');
  });

  it('falls back to the closest existing ancestor for a missing leaf', () => {
    const range = locateInstancePathInYaml(DOC, '/ssh_keys/0/nonexistent');
    expect(slice(range)).toContain('name: laptop');
  });

  it('returns null for the document root, unresolvable paths and garbage input', () => {
    expect(locateInstancePathInYaml(DOC, '')).toBeNull();
    expect(locateInstancePathInYaml(DOC, '/no_such_key')).toBeNull();
    expect(locateInstancePathInYaml('{{{ not yaml', '/a')).toBeNull();
  });
});
