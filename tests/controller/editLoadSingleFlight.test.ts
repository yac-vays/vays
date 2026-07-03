/**
 * The edit view loads the schema twice on mount: once from the form pane
 * (useInitializeState) and once from the Monaco editor's init plugin
 * (schemaInitializer). Both used to run their own retreiveSchema, whose
 * stabilization loop works on module-global editing state — so the slower
 * run computed its defaults patch against the baseline the faster run had
 * already replaced, sent an empty patch and ended up with the stored YAML
 * *without* the injected defaults (a "Missing property" marker in the
 * editor on roughly every other reload).
 *
 * These tests pin the single-flight behavior: concurrent duplicate loads
 * share one request chain and both callers receive the fully stabilized
 * result (as independent copies).
 */
import { expect, test, vi } from 'vitest';
import { retreiveSchema } from '../../src/controller/local/EditController/shared';
import { getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

const URL = 'https://yac_no_token.com';
const HOST = 'web01';

// Stored entity predates the required-with-default property, the case that
// exposed the race (defaults are injected in a second validate pass).
const STORED_YAML = 'owner: alice\n';
const STORED_DATA = { owner: 'alice' };

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['owner', 'firewall_enabled'],
  properties: {
    owner: { type: 'string' },
    firewall_enabled: { type: 'boolean', default: true },
  },
};

const ENTITY_RESPONSE = {
  name: HOST,
  link: null,
  options: {},
  perms: ['see', 'edt'],
  data: STORED_DATA,
  yaml: STORED_YAML,
  hash: 'h1',
};

function validateResponse(patch: { [key: string]: unknown }) {
  const data = { ...STORED_DATA, ...patch };
  const hasDefaults = 'firewall_enabled' in data;
  return {
    schemas: {
      json_schema: JSON_SCHEMA,
      ui_schema: { type: 'VerticalLayout', elements: [] },
      data: data,
      valid: hasDefaults,
      message: hasDefaults ? null : "'firewall_enabled' is a required property",
      validator: null,
      json_schema_loc: hasDefaults ? null : '#/required',
      data_loc: hasDefaults ? null : '#',
      // like the backend: the patch merged into the stored YAML
      yaml: STORED_YAML + (hasDefaults ? `firewall_enabled: ${data.firewall_enabled}\n` : ''),
    },
    request: { valid: true, message: null },
    usages: [],
  };
}

function fetchResponse(data: object) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = { json: () => Promise.resolve(data), status: 200, clone: () => a };
  return a;
}

// Requests are held in a queue and answered manually, so the test controls
// the exact interleaving of the two concurrent loads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PendingRequest = { kind: 'get' | 'validate'; patch: any; answer: () => void };
const pending: PendingRequest[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.fetch as any).mockImplementation((url: string, opts: any) => {
  return new Promise((resolve) => {
    const isValidate = String(url).includes('/validate');
    const patch = isValidate ? (JSON.parse(opts.body).entity?.data ?? {}) : null;
    pending.push({
      kind: isValidate ? 'validate' : 'get',
      patch: patch,
      answer: () => resolve(fetchResponse(isValidate ? validateResponse(patch) : ENTITY_RESPONSE)),
    });
  });
});

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

async function answerNext(kind: 'get' | 'validate'): Promise<PendingRequest> {
  const i = pending.findIndex((p) => p.kind === kind);
  expect(i, `expected a pending ${kind} request`).toBeGreaterThanOrEqual(0);
  const req = pending.splice(i, 1)[0];
  req.answer();
  await flushMicrotasks();
  return req;
}

test('concurrent edit loads are single-flighted and both get the stabilized result', async () => {
  const ctx = getTestEditRequestContext(URL, 'test', HOST, 'testType', 'edit');

  // form pane and editor plugin fire the same load concurrently
  const formLoad = retreiveSchema(ctx);
  await flushMicrotasks();
  const editorLoad = retreiveSchema(ctx);
  await flushMicrotasks();

  // one shared chain: GET, pass 1 (empty patch), pass 2 (defaults patch)
  await answerNext('get');
  const pass1 = await answerNext('validate');
  expect(pass1.patch).toStrictEqual({});
  const pass2 = await answerNext('validate');
  expect(pass2.patch).toStrictEqual({ firewall_enabled: true });
  expect(pending).toHaveLength(0);

  const [formResp, editorResp] = await Promise.all([formLoad, editorLoad]);

  // both panes see the YAML with the injected default (this is what raced
  // away for the slower caller before)
  expect(formResp?.yaml).toContain('firewall_enabled: true');
  expect(editorResp?.yaml).toContain('firewall_enabled: true');

  // the duplicate caller gets an equal but independent copy, so the two
  // panes never mutate shared objects
  expect(editorResp).toStrictEqual(formResp);
  expect(editorResp).not.toBe(formResp);
  expect(editorResp?.data).not.toBe(formResp?.data);

  // exactly one GET + two validates for the whole page load
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('a later load is not served a stale finished result', async () => {
  const ctx = getTestEditRequestContext(URL, 'test', HOST, 'testType', 'edit');

  const first = retreiveSchema(ctx);
  await flushMicrotasks();
  await answerNext('get');
  await answerNext('validate');
  await answerNext('validate');
  expect(await first).not.toBeNull();

  // the in-flight entry is gone once settled: a new load fetches again
  const second = retreiveSchema(ctx);
  await flushMicrotasks();
  await answerNext('get');
  await answerNext('validate');
  await answerNext('validate');
  expect((await second)?.yaml).toContain('firewall_enabled: true');
});
