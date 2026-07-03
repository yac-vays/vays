/**
 * Session-staleness guarantees (see controller/local/EditController/session.ts):
 * async work dispatched in one editing session must not write into the next
 * one. Covers the cross-entity flavor of the load race: a slow schema load for
 * entity A resolving after the user navigated to entity B used to overwrite
 * B's baselines (`initialData`/`initialYAML`, i.e. the diff + `yaml_old`
 * commit baseline) and the YAC status with A's.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import editingState from '../../src/controller/state/EditCtrlState';
import {
  hasPendingDebouncedCommits,
  trackedDebounce,
} from '../../src/controller/local/EditController/debounceRegistry';
import {
  activateEditingSession,
  beginValidationDispatch,
  currentSession,
  endValidationDispatch,
  isStaleSession,
  isStaleValidation,
  newEditingView,
  nextValidationSeq,
  whenValidationIdle,
} from '../../src/controller/local/EditController/session';
import { beginPaneSession, retreiveSchema } from '../../src/controller/local/EditController/shared';
import { getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

const URL = 'https://yac_no_token.com';

const ENTITY_A_YAML = 'owner: alice\n';

function fetchResponse(data: object) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = { json: () => Promise.resolve(data), status: 200, clone: () => a };
  return a;
}

// Manual answer queue so the test controls when entity A's slow load resolves.
 
type PendingRequest = { kind: 'get' | 'validate'; answer: () => void };
const pending: PendingRequest[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.fetch as any).mockImplementation((url: string) => {
  return new Promise((resolve) => {
    const isValidate = String(url).includes('/validate');
    pending.push({
      kind: isValidate ? 'validate' : 'get',
      answer: () =>
        resolve(
          fetchResponse(
            isValidate
              ? {
                  schemas: {
                    json_schema: { type: 'object', properties: {} },
                    ui_schema: { type: 'VerticalLayout', elements: [] },
                    data: { owner: 'alice' },
                    valid: true,
                    message: null,
                    validator: null,
                    json_schema_loc: null,
                    data_loc: null,
                    yaml: ENTITY_A_YAML,
                  },
                  request: { valid: true, message: null },
                  usages: [],
                }
              : {
                  name: 'web01',
                  link: null,
                  options: {},
                  perms: ['see', 'edt'],
                  data: { owner: 'alice' },
                  yaml: ENTITY_A_YAML,
                  hash: 'h1',
                },
          ),
        ),
    });
  });
});

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  pending.length = 0;
});

describe('session epoch', () => {
  it('a schema load resolving after a session change returns null and leaves the baselines alone', async () => {
    const ctxA = getTestEditRequestContext(URL, 'test', 'web01', 'testType', 'edit');
    const ctxB = getTestEditRequestContext(URL, 'test', 'web02', 'testType', 'edit');

    newEditingView();
    beginPaneSession(ctxA);
    const loadA = retreiveSchema(ctxA);
    await flushMicrotasks();

    // The user navigates on to entity B while A's GET is still in flight.
    newEditingView();
    beginPaneSession(ctxB);
    editingState.initialYAML = 'THE-BASELINE-OF-B';
    editingState.initialData = { of: 'B' };

    // A's backend responses arrive late.
    while (pending.length > 0) {
      pending.shift()?.answer();
      await flushMicrotasks();
    }

    expect(await loadA).toBeNull();
    // B's session baselines (diff + yaml_old commit baseline) are untouched.
    expect(editingState.initialYAML).toBe('THE-BASELINE-OF-B');
    expect(editingState.initialData).toStrictEqual({ of: 'B' });
  });

  it('activating a new session invalidates stamped validations from the previous one', () => {
    const ctxA = getTestEditRequestContext(URL, 'test', 'web01', 'testType', 'edit');
    const ctxB = getTestEditRequestContext(URL, 'test', 'web02', 'testType', 'edit');

    newEditingView();
    activateEditingSession(ctxA);
    const epochA = currentSession();
    const seqA = nextValidationSeq();
    expect(isStaleValidation(seqA)).toBe(false);
    expect(isStaleSession(epochA)).toBe(false);

    // Same view + same target: re-activation is NOT a new session (the lazy
    // Monaco pane arriving late must not orphan in-flight work).
    const again = activateEditingSession(ctxA);
    expect(again.isNewSession).toBe(false);
    expect(isStaleValidation(seqA)).toBe(false);

    // Different target: new session; the old stamp is stale everywhere.
    const changed = activateEditingSession(ctxB);
    expect(changed.isNewSession).toBe(true);
    expect(isStaleValidation(seqA)).toBe(true);
    expect(isStaleSession(epochA)).toBe(true);

    // Same target again but a NEW view (remount): also a new session.
    activateEditingSession(ctxB);
    newEditingView();
    const remounted = activateEditingSession(ctxB);
    expect(remounted.isNewSession).toBe(true);
  });

  it('a new session resets meta state but a late same-session pane activation does not', () => {
    const ctx = getTestEditRequestContext(URL, 'test', 'web01', 'testType', 'edit');
    newEditingView();
    beginPaneSession(ctx);

    // User state set mid-session (e.g. before the lazy editor chunk arrived).
    editingState.isDirty = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editingState.activatedActions = [{ name: 'install' } as any];

    beginPaneSession(ctx); // second pane, same session
    expect(editingState.isDirty).toBe(true);
    expect(editingState.activatedActions).toHaveLength(1);

    newEditingView();
    beginPaneSession(ctx); // remount => fresh session
    expect(editingState.isDirty).toBe(false);
    expect(editingState.activatedActions).toHaveLength(0);
    expect(editingState.canonicalSeeded).toBe(false);
  });
});

describe('validation quiescence + pending input probes', () => {
  it('whenValidationIdle waits for the bracket to close', async () => {
    beginValidationDispatch();
    let resolved = false;
    const wait = whenValidationIdle().then(() => {
      resolved = true;
    });
    await flushMicrotasks();
    expect(resolved).toBe(false);
    endValidationDispatch();
    await wait;
    expect(resolved).toBe(true);
    // Idle: resolves immediately.
    await whenValidationIdle();
  });

  it('trackedDebounce reports pending input until the call commits', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const d = trackedDebounce(spy, 500);
    expect(d.pending()).toBe(false);
    d('x');
    expect(d.pending()).toBe(true);
    d.flush();
    expect(d.pending()).toBe(false);
    expect(spy).toHaveBeenCalledWith('x');
    d('y');
    d.cancel();
    expect(d.pending()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(hasPendingDebouncedCommits()).toBe(false);
    vi.useRealTimers();
  });
});
