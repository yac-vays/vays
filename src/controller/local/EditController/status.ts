/**
 * Status of the editing session: validity, usages, permissions, admin
 * override, unsaved edits and a failed validation.
 */
import { resetEagerGenerated } from '../../../utils/schema/eagerValues';
import { LimitUsage } from '../../../utils/types/api';
import { RequestEditContext } from '../../../utils/types/internal/request';
import editingState from '../../state/EditCtrlState';
import { notifyEditStateChange } from '../../state/editStateEvents';
import { emitChangeState, setErrorMessage } from './editState';
import { activateEditingSession, currentSession, isStaleSession } from './session';

/**
 * Reset internal status storing the most recent YAC response (the one
 * which is also displayed in the footer of the edit view)
 */
export function resetSessionStatus() {
  validationRetry = null;
  setYACValidStatus(true);
  setLocalValidity(true);
  setYACUsages([]);
  setEntityPerms([]);
  // The admin override is per-commit intent: a fresh session starts locked.
  setAdminOverride(false);
  emitValidity();
  // A fresh editing session starts clean (called on both panes' init).
  clearEditDirty();
  // Pending schema-forbidden removals are scoped to a single session.
  editingState.strippedPaths.clear();
}

/**
 * Activate the editing session for `ctx` on behalf of a pane and return the
 * session epoch. Exactly the FIRST activation of a new session performs the
 * one-time session resets; a pane initializing late into a running session
 * (e.g. the lazily-loaded Monaco chunk) is a no-op here and cannot wipe state
 * the user already changed (activated actions, dirty flag, validity).
 */
export function beginPaneSession(requestEditContext: RequestEditContext): number {
  const { epoch, isNewSession } = activateEditingSession(requestEditContext);
  if (isNewSession) {
    resetSessionStatus();
    // Session-scoped fields left behind by the previous session. The canonical
    // pair / save payload are re-seeded by this session's schema load; until
    // then `canonicalSeeded` keeps consumers (revalidateMeta) from reading the
    // previous document.
    editingState.activatedActions = [];
    editingState.entityName = requestEditContext.entityName ?? null;
    editingState.canonicalData = {};
    editingState.canonicalYAML = '';
    editingState.canonicalSeeded = false;
    editingState.entityYAML = undefined;
    editingState.currentJsonSchema = null;
    editingState.previousDefaultsObject = null;
    editingState.suppressNextFormChange = false;
    editingState.suppressNextYamlChange = false;
    resetEagerGenerated();
    // No payload yet in the fresh session — nothing to commit until seeded.
    emitChangeState();
  }
  return epoch;
}

/** Mark the editing session as having unsaved user edits. */
export function setEditDirty() {
  editingState.isDirty = true;
}

/** Clear the unsaved-edits flag (on session init and after a successful save). */
export function clearEditDirty() {
  editingState.isDirty = false;
}

/** Whether the editor currently holds unsaved user edits. */
export function isEditDirty(): boolean {
  return editingState.isDirty;
}

export function setYACStatus(
  valid: boolean,
  usages: LimitUsage[] = [],
  usagesData: unknown = null,
) {
  // Any answer from the backend supersedes an earlier failed validation.
  validationRetry = null;
  setYACValidStatus(valid);
  setYACUsages(usages, usagesData);
  emitValidity();
}

/**
 * Footer status while the latest edit could not be validated (network error,
 * 5xx, 503, bad response). The panes keep showing the user's document; only
 * Commit is blocked, because the save payload (the canonical YAML) is produced
 * by the validation round-trip and would miss the unvalidated edit.
 */
export const VALIDATION_FAILED_DETAIL =
  'Your last change could not be validated (backend unreachable or error). ' +
  'Your edits are kept — retry before committing.';

// How to re-dispatch the validation that failed, with the session it belongs to.
let validationRetry: { retry: () => void; epoch: number } | null = null;

/**
 * Record that a validation of the current document failed: block Commit, show
 * {@link VALIDATION_FAILED_DETAIL} in the footer and remember `retry` for its
 * "Retry" button. The last known usages/perms are kept (they still describe a
 * very similar document) — only the verdict is unknown.
 */
export function reportValidationFailed(retry: () => void) {
  validationRetry = { retry, epoch: currentSession() };
  setYACValidStatus(false);
  emitValidity();
  setErrorMessage(VALIDATION_FAILED_DETAIL);
}

/** Whether a footer message reports a failed validation (offers "Retry"). */
export function isValidationFailedMessage(msg: string): boolean {
  return msg === VALIDATION_FAILED_DETAIL;
}

/**
 * Whether the latest validation failed without an answer. Blocks Commit even
 * with the admin override: the save payload would miss the unvalidated edit.
 */
export function isValidationFailed(): boolean {
  return validationRetry != null;
}

/**
 * Re-dispatch the failed validation (no-op in another session). The failure
 * stays recorded until a validation gets an answer (see setYACStatus).
 */
export function retryValidation() {
  if (validationRetry == null || isStaleSession(validationRetry.epoch)) return;
  validationRetry.retry();
}

/**
 * Reactive bridge for overall form validity, like `subscribeToUsages`. The
 * edit view (`EditFrame`) registers a listener to enable/disable the Commit
 * button. Validity combines the backend verdict (`isValidYAC`, from every
 * `setYACStatus`) with the form's own JSON Forms error count (`isValidLocal`,
 * pushed from the form pane's `onChange`).
 */
let validityListener: ((valid: boolean) => void) | null = null;

export function setValidityListener(cb: ((valid: boolean) => void) | null) {
  validityListener = cb;
}

/** True when both the backend and the live form report no errors. */
export function isFormValid(): boolean {
  return editingState.isValidYAC && editingState.isValidLocal;
}

/** Record whether the form's own (JSON Forms) validation currently has errors. */
export function setLocalValidity(valid: boolean) {
  editingState.isValidLocal = valid;
}

export function emitValidity() {
  validityListener?.(isFormValid());
}

/**
 * Reactive bridge for the `limits` usage indicators. Both edit modes funnel
 * their validation results through `setYACStatus`, so every subscriber
 * receives every update for free. Multiple subscribers exist (per-field
 * chips, the meta-panel chips next to the name, the editor's gutter glyphs),
 * hence a subscription set rather than the single-listener bridges around it.
 * Subscribing immediately pushes the current state.
 */
const usagesListeners = new Set<(usages: LimitUsage[]) => void>();

export function subscribeToUsages(cb: (usages: LimitUsage[]) => void): () => void {
  usagesListeners.add(cb);
  cb(editingState.yacUsages);
  return () => usagesListeners.delete(cb);
}

export function getYACUsages(): LimitUsage[] {
  return editingState.yacUsages;
}

/** The entity data the current usages were measured for (see `yacUsagesData`). */
export function getYACUsagesData(): unknown {
  return editingState.yacUsagesData;
}

/**
 * @param usagesData The entity data of the validation the usages come from;
 * copied, as the caller's response object is mutated afterwards (defaults).
 */
export function setYACUsages(usages: LimitUsage[], usagesData: unknown = null) {
  editingState.yacUsages = usages;
  editingState.yacUsagesData = usagesData == null ? null : structuredClone(usagesData);
  for (const cb of usagesListeners) cb(usages);
}

/**
 * Reactive bridge for the entity permissions reported by validations, like
 * `subscribeToUsages`. The edit view uses them to decide whether to OFFER the
 * admin override ("adm" permission); the backend re-checks on commit anyway.
 * Registering immediately pushes the current state.
 */
let entityPermsListener: ((perms: string[]) => void) | null = null;

export function setEntityPermsListener(cb: ((perms: string[]) => void) | null) {
  entityPermsListener = cb;
  cb?.(editingState.entityPerms);
}

export function setEntityPerms(perms: string[]) {
  editingState.entityPerms = perms;
  entityPermsListener?.(perms);
  notifyEditStateChange();
}

/** The user's permissions on the entity, as of the latest validation. */
export function getEntityPerms(): string[] {
  return editingState.entityPerms;
}

/**
 * Reactive bridge for the admin override ("admin mode") state. Owned by the
 * controller (not the view) so the save path can auto-relock after a
 * successful commit and the session reset can relock on navigation.
 * Registering immediately pushes the current state.
 */
let adminOverrideListener: ((active: boolean) => void) | null = null;

export function setAdminOverrideListener(cb: ((active: boolean) => void) | null) {
  adminOverrideListener = cb;
  cb?.(editingState.adminOverride);
}

export function setAdminOverride(active: boolean) {
  editingState.adminOverride = active;
  adminOverrideListener?.(active);
  notifyEditStateChange();
}

export function isAdminOverride(): boolean {
  return editingState.adminOverride;
}

export function setYACValidStatus(valid: boolean) {
  editingState.isValidYAC = valid;
}
