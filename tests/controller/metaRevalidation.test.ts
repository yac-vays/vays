/**
 * A name/action change re-validates the canonical pair. It must wait for a
 * pane validation that is still in flight — whose edit is not in the pair
 * yet — instead of superseding it.
 */
import { afterEach, expect, test, vi } from 'vitest';
import editingState from '../../src/controller/state/EditCtrlState';
import {
  beginValidationDispatch,
  endValidationDispatch,
  newEditingView,
  nextValidationSeq,
  isStaleValidation,
  setValidatingListener,
} from '../../src/controller/local/EditController/session';
import { beginPaneSession } from '../../src/controller/local/EditController/status';
import { revalidateMeta, seedCanonical } from '../../src/controller/local/EditController/sync';
import { getTestEditRequestContext } from '../testUtils';

const URL = 'https://yac_no_token.com';

function validateResponse(data: object) {
  const body = {
    schemas: {
      json_schema: { type: 'object', properties: {} },
      ui_schema: { type: 'VerticalLayout', elements: [] },
      data,
      valid: true,
      message: null,
      validator: null,
      json_schema_loc: null,
      data_loc: null,
      yaml: 'owner: alice\n',
    },
    request: { valid: true, message: null },
    usages: [],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = { json: () => Promise.resolve(body), status: 200, clone: () => a };
  return a;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => setValidatingListener(null));

test('waits for the in-flight pane validation, then sends the updated pair', async () => {
  const sent: string[] = [];
  global.fetch = vi.fn(async (_url, init) => {
    sent.push(String((init as RequestInit).body));
    return validateResponse({ owner: 'bob' });
  }) as unknown as typeof fetch;

  const ctx = getTestEditRequestContext(URL, 'be', 'web01', 'host', 'create');
  newEditingView();
  beginPaneSession(ctx);
  seedCanonical({ owner: 'alice' }, 'owner: alice\n');
  editingState.previousDefaultsObject = {};

  // A pane validation is in flight.
  const paneSeq = nextValidationSeq();
  beginValidationDispatch();

  const first = revalidateMeta(ctx);
  const second = revalidateMeta(ctx); // covered by the waiting one
  await flush();
  expect(sent).toHaveLength(0);
  expect(isStaleValidation(paneSeq)).toBe(false);

  // The pane validation lands: its edit is now part of the canonical pair.
  editingState.canonicalData = { owner: 'bob' };
  endValidationDispatch();
  await Promise.all([first, second]);

  expect(sent).toHaveLength(1);
  expect(sent[0]).toContain('bob');
});

test('the validating listener follows the in-flight count', () => {
  const states: boolean[] = [];
  setValidatingListener((v) => states.push(v));
  beginValidationDispatch();
  beginValidationDispatch();
  endValidationDispatch();
  endValidationDispatch();
  expect(states).toEqual([false, true, false]);
});
