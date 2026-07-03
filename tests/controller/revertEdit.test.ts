/**
 * Reverting a form edit must revert the YAML too.
 *
 * Form edits are sent as a PATCH that the backend merges into the CURRENT
 * editor document (`yaml_base`). The patch used to be diffed against the
 * session-LOAD baseline: changing a value A -> B -> back to A produced an
 * empty patch, so B survived in the YAML (and in what would be committed)
 * even though the form showed A. The patch is now diffed against the
 * canonical pair — the data belonging to the very document it is merged into.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEntityYAML,
  seedCanonical,
} from '../../src/controller/local/EditController/ExpertMode/access';
import { newEditingView } from '../../src/controller/local/EditController/session';
import { beginPaneSession, retreiveSchema } from '../../src/controller/local/EditController/shared';
import { updateSchema } from '../../src/controller/local/EditController/StandardMode';
import { applyCanonical } from '../../src/controller/local/EditController/sync';
import { getTestEditRequestContext } from '../testUtils';

// Micro YAML for single-level string/boolean docs: enough to emulate YAC's
// patch-into-yaml_base merge faithfully for this scenario.
function parseDoc(yaml: string): { [key: string]: string } {
  const data: { [key: string]: string } = {};
  for (const line of yaml.split('\n')) {
    const m = /^(\w+): (.*)$/.exec(line);
    if (m) data[m[1]] = m[2];
  }
  return data;
}
function dumpDoc(data: { [key: string]: unknown }): string {
  return `${Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n`;
}

const STORED_YAML = 'owner: alice\nrole_docker: false\n';

const validatePatches: unknown[] = [];

global.fetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.fetch as any).mockImplementation((url: string, opts: any) => {
  if (!String(url).includes('/validate')) {
    return Promise.resolve(
      fetchResponse({
        name: 'web01',
        link: null,
        options: {},
        perms: ['see', 'edt'],
        data: parseDoc(STORED_YAML),
        yaml: STORED_YAML,
        hash: 'h1',
      }),
    );
  }
  const body = JSON.parse(opts.body);
  const patch = body.entity?.data ?? {};
  validatePatches.push(structuredClone(patch));
  // YAC semantics: merge the patch into yaml_base ('~undefined' unsets).
  const base = parseDoc(body.entity?.yaml_base ?? STORED_YAML);
  for (const [k, v] of Object.entries(patch)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (v === '~undefined') delete base[k];
    else base[k] = String(v);
  }
  return Promise.resolve(
    fetchResponse({
      schemas: {
        json_schema: {
          type: 'object',
          properties: { owner: { type: 'string' }, role_docker: { type: 'boolean' } },
        },
        ui_schema: { type: 'VerticalLayout', elements: [] },
        data: base,
        valid: true,
        message: null,
        validator: null,
        json_schema_loc: null,
        data_loc: null,
        yaml: dumpDoc(base),
      },
      request: { valid: true, message: null },
      usages: [],
    }),
  );
});

function fetchResponse(data: object) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = { json: () => Promise.resolve(data), status: 200, clone: () => a };
  return a;
}

/** One form edit exactly like StandardEditMode dispatches it. */
async function formEdit(ctx: ReturnType<typeof getTestEditRequestContext>, data: object) {
  const resp = await updateSchema(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data as any,
    ctx,
    true,
    false,
    'web01',
    getEntityYAML(),
  );
  expect(resp).not.toBeNull();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  applyCanonical('form', resp!);
  return resp;
}

describe('reverting a form edit', () => {
  beforeEach(() => {
    validatePatches.length = 0;
  });

  it('reverts the YAML as well (string and boolean round trip)', async () => {
    const ctx = getTestEditRequestContext('https://yac_no_token.com', 'test', 'web01', 't', 'edit');
    newEditingView();
    beginPaneSession(ctx);
    await retreiveSchema(ctx);
    expect(getEntityYAML()).toBe(STORED_YAML); // canonical seeded by the load

    // A -> B: the change lands in the YAML.
    await formEdit(ctx, { owner: 'bob', role_docker: true });
    expect(getEntityYAML()).toBe('owner: bob\nrole_docker: true\n');

    // B -> A: the revert must produce a NON-empty patch and restore the YAML.
    validatePatches.length = 0;
    await formEdit(ctx, { owner: 'alice', role_docker: false });
    expect(validatePatches[0]).toStrictEqual({ owner: 'alice', role_docker: false });
    expect(getEntityYAML()).toBe(STORED_YAML);
  });

  it('unsets a key again that was added and then removed in the form', async () => {
    const ctx = getTestEditRequestContext('https://yac_no_token.com', 'test', 'web01', 't', 'edit');
    newEditingView();
    beginPaneSession(ctx);
    // Seed directly (equivalent to the load's seeding) to start from a known doc.
    seedCanonical(parseDoc(STORED_YAML), STORED_YAML);

    await formEdit(ctx, { owner: 'alice', role_docker: 'false', comment: 'hello' });
    expect(getEntityYAML()).toContain('comment: hello');

    await formEdit(ctx, { owner: 'alice', role_docker: 'false' });
    expect(getEntityYAML()).not.toContain('comment');
    expect(getEntityYAML()).toBe(STORED_YAML);
  });
});
