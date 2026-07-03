import { RequestEditContext } from '../../../utils/types/internal/request';
import editingState from '../../state/EditCtrlState';

/**
 * Editing-session identity.
 *
 * Every mount of the edit view starts one *session* shared by both panes (form
 * + YAML editor). Async work — schema loads, validation round-trips, debounced
 * editor commits — captures the session epoch when it is dispatched and must
 * not write to the shared editing state (`editingState`) once the epoch has
 * moved on, otherwise a slow response from entity A lands in entity B's
 * session (stale baselines, wrong save payload, cross-entity corruption).
 *
 * Two triggers start a new epoch (see {@link activateEditingSession}):
 *  - the edit view (re)mounted ({@link newEditingView}), or
 *  - the activation context targets a different document.
 *
 * A pane initializing *late* into a running session (e.g. the lazily-loaded
 * Monaco chunk) re-activates with the same view + target and is a no-op, so it
 * cannot wipe state the user already changed nor orphan in-flight validations.
 */

// Bumped on every edit-view mount (before the panes render), so returning to
// the same entity still starts a fresh session.
let viewSeq = 0;
// The view instance the current session belongs to.
let activatedViewSeq = -1;

/** Called from the edit view's render (idempotent per mount via useMemo). */
export function newEditingView() {
  viewSeq += 1;
}

/**
 * Whether two contexts describe the same editing target. The entity name is
 * part of the identity only outside create mode: while creating, typing a name
 * navigates the URL along without leaving the session.
 */
function sameEditingTarget(a: RequestEditContext, b: RequestEditContext): boolean {
  return (
    a.rc.yacURL === b.rc.yacURL &&
    a.rc.entityTypeName === b.rc.entityTypeName &&
    a.mode === b.mode &&
    (a.mode === 'create' || (a.entityName ?? null) === (b.entityName ?? null))
  );
}

/**
 * Make `ctx` the current session (both panes call this on init). Returns the
 * session epoch and whether a NEW session began — the caller performs the
 * one-time session resets only in that case.
 */
export function activateEditingSession(ctx: RequestEditContext): {
  epoch: number;
  isNewSession: boolean;
} {
  const current = editingState.currentEditContext;
  const isNewSession =
    activatedViewSeq !== viewSeq || current == null || !sameEditingTarget(current, ctx);

  if (isNewSession) {
    activatedViewSeq = viewSeq;
    editingState.sessionSeq += 1;
    // Any stamped validation still in flight belongs to the previous session;
    // advancing the validation counter makes its response stale everywhere.
    editingState.validationSeq += 1;
  }
  editingState.currentEditContext = ctx;
  return { epoch: editingState.sessionSeq, isNewSession };
}

/** The current session epoch — capture it when dispatching async work. */
export function currentSession(): number {
  return editingState.sessionSeq;
}

/**
 * Stamp a new validation dispatch. Callers keep the returned id and pass it to
 * {@link isStaleValidation} when their response resolves. (Lives here rather
 * than in sync.ts so the controller core can consume it without an import
 * cycle; sync.ts re-exports both for the panes.)
 */
export function nextValidationSeq(): number {
  return ++editingState.validationSeq;
}

/** True if a newer validation has been dispatched since `seq` (drop the response). */
export function isStaleValidation(seq: number): boolean {
  return seq < editingState.validationSeq;
}

/**
 * True if the session has changed since `epoch` was captured: the async flow
 * holding it must not write to the shared editing state anymore.
 */
export function isStaleSession(epoch: number): boolean {
  return epoch !== editingState.sessionSeq;
}

//
// Validation quiescence.
//
// The save path must not read the save payload (`entityYAML`) while a
// validation that will update it is still in flight — otherwise what is saved
// is older than what the user sees. Every validation dispatch is bracketed
// with begin/end; the save path awaits idleness after flushing the debounces.
//

let pendingValidations = 0;
let idleWaiters: (() => void)[] = [];

/** Bracket a validation dispatch (call in try/finally with the end call). */
export function beginValidationDispatch() {
  pendingValidations += 1;
}

export function endValidationDispatch() {
  pendingValidations = Math.max(0, pendingValidations - 1);
  if (pendingValidations === 0) {
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach((resolve) => resolve());
  }
}

/**
 * Resolves once no validation dispatch is in flight (immediately if idle).
 * The timeout is a safety net so a hung request can never wedge the save
 * path — after it, the caller proceeds with the state it has.
 */
export function whenValidationIdle(timeoutMs: number = 15000): Promise<void> {
  if (pendingValidations === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      idleWaiters = idleWaiters.filter((w) => w !== wrapped);
      resolve();
    }, timeoutMs);
    const wrapped = () => {
      clearTimeout(timer);
      resolve();
    };
    idleWaiters.push(wrapped);
  });
}
