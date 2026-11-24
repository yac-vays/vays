/**
 * A validation that is still pending when the wait for it times out blocks
 * the commit: an edit reaches the save payload only through its validation
 * round-trip, so committing then would store the previous document and report
 * success. Nothing is sent, an error toast explains it and the session keeps
 * its state for another try.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const showError = vi.fn();
vi.mock('../../src/controller/global/notification', () => ({ showError }));
const editEntity = vi.fn(async () => ({ kind: 'failed' }));
vi.mock('../../src/model/edit', () => ({ editEntity }));
const createNewEntity = vi.fn(async () => ({ success: false, name: null }));
vi.mock('../../src/model/create', () => ({ createNewEntity }));

const { registerModalCallback } = await import('../../src/controller/global/modal');
const { commitEntity } = await import('../../src/controller/local/EditController/commit');
const { getEntityYAML, hasUncommittedChanges, setEntityYAML, setInitialEntityYAML } =
  await import('../../src/controller/local/EditController/editState');
const { beginValidationDispatch, endValidationDispatch, whenValidationIdle } =
  await import('../../src/controller/local/EditController/session');
const { default: editingState } = await import('../../src/controller/state/EditCtrlState');
const { getTestEditRequestContext } = await import('../testUtils');

const PAYLOAD = 'owner: alice\nfirewall_enabled: true\n';
const TOAST = [
  'Test / test / web01',
  'Not committed: the validation of the document did not finish. ' +
    'Wait for it to finish and commit again.',
];

let confirms: (() => Promise<void>)[] = [];
const ctx = () => getTestEditRequestContext('https://x', 'be', 'web01', 'host', 'edit');

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  confirms = [];
  registerModalCallback((_title, _text, callbackSuccess) => {
    confirms.push(() => callbackSuccess(undefined, []));
  });
  editingState.isValidYAC = true;
  editingState.activatedActions = [];
  editingState.entityName = null;
  setInitialEntityYAML('owner: alice\n');
  setEntityYAML(PAYLOAD);
});

afterEach(() => {
  endValidationDispatch();
  vi.useRealTimers();
});

describe('commit with a validation that does not finish', () => {
  it('whenValidationIdle tells a timeout from idleness', async () => {
    expect(await whenValidationIdle()).toBe(true);
    beginValidationDispatch();
    const timedOut = whenValidationIdle(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await timedOut).toBe(false);
    const settled = whenValidationIdle(1000);
    endValidationDispatch();
    expect(await settled).toBe(true);
  });

  it('does not ask for confirmation while the validation is pending', async () => {
    beginValidationDispatch();
    const commit = commitEntity(ctx());
    await vi.advanceTimersByTimeAsync(80 + 15000);
    await commit;

    expect(confirms).toHaveLength(0);
    expect(editEntity).not.toHaveBeenCalled();
    expect(showError.mock.calls).toStrictEqual([TOAST]);
    // The session is untouched: the change can be committed later.
    expect(getEntityYAML()).toBe(PAYLOAD);
    expect(hasUncommittedChanges()).toBe(true);

    // Retry once the validation has settled.
    endValidationDispatch();
    const retry = commitEntity(ctx());
    await vi.advanceTimersByTimeAsync(80);
    await retry;
    expect(confirms).toHaveLength(1);
  });

  it('sends nothing when the validation started while the dialogue was open', async () => {
    const commit = commitEntity(ctx());
    await vi.advanceTimersByTimeAsync(80);
    await commit;
    expect(confirms).toHaveLength(1);

    beginValidationDispatch(); // e.g. the editor's debounce fired
    const confirmed = confirms[0]();
    await vi.advanceTimersByTimeAsync(15000);
    await confirmed;

    expect(editEntity).not.toHaveBeenCalled();
    expect(showError.mock.calls).toStrictEqual([TOAST]);
    expect(getEntityYAML()).toBe(PAYLOAD);
    expect(hasUncommittedChanges()).toBe(true);
  });

  it('create mode: sends nothing either', async () => {
    beginValidationDispatch();
    const commit = commitEntity(
      getTestEditRequestContext('https://x', 'be', null, 'host', 'create'),
    );
    await vi.advanceTimersByTimeAsync(80 + 15000);
    await commit;
    expect(confirms).toHaveLength(0);
    expect(createNewEntity).not.toHaveBeenCalled();
    // No entity name yet: the title is the breadcrumb of the type.
    expect(showError.mock.calls).toStrictEqual([['Test / test', TOAST[1]]]);
  });

  it('commits when the validation settles in time', async () => {
    const commit = commitEntity(ctx());
    await vi.advanceTimersByTimeAsync(80);
    await commit;

    beginValidationDispatch();
    const confirmed = confirms[0]();
    await vi.advanceTimersByTimeAsync(5000);
    expect(editEntity).not.toHaveBeenCalled();
    endValidationDispatch();
    await confirmed;

    expect(editEntity).toHaveBeenCalledTimes(1);
    expect(editEntity.mock.calls[0].slice(0, 2)).toStrictEqual(['web01', PAYLOAD]);
    expect(showError).not.toHaveBeenCalled();
  });
});
