/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionDecl } from '../../../../utils/types/api';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import editingState from '../../../state/EditCtrlState';

export function setMonacoYaml(e: any) {
  editingState.monacoyaml = e;
}

export function getMonacoYaml() {
  return editingState.monacoyaml;
}

export function setCurrentContext(e: RequestEditContext) {
  editingState.currentEditContext = e;
}

export function getCurrentContext() {
  return editingState.currentEditContext;
}

export function setEntityYAML(yaml: string) {
  editingState.entityYAML = yaml;
  emitChangeState();
}

export function getEntityYAML() {
  return editingState.entityYAML;
}

/**
 * Seed the canonical `{data, yaml}` pair (see sync.ts): at load time so a
 * pane's own initial `setValue` is recognized as "already canonical" (no
 * redundant validation round-trip), and so form edits made before the lazy
 * Monaco pane mounts already have the correct patch baseline + merge base.
 */

export function seedCanonical(data: any, yaml: string) {
  editingState.canonicalData = data;
  editingState.canonicalYAML = yaml;
  // Also the live editor-YAML string, so the very first form edit has the
  // initial document (e.g. the create defaults template) as its merge base.
  setEntityYAML(yaml);
  // The canonical pair now belongs to the current session; meta-triggered
  // revalidation may use it from here on.
  editingState.canonicalSeeded = true;
}

//
// Uncommitted-change tracking (drives the Commit button's no-op guard).
//

let changeListener: ((hasChanges: boolean) => void) | null = null;

/** Register the view's listener; immediately called with the current state. */
export function setChangeListener(cb: ((hasChanges: boolean) => void) | null) {
  changeListener = cb;
  cb?.(hasUncommittedChanges());
}

/**
 * Whether committing now would write something different from what is stored.
 * Only meaningful in edit mode: the backend rejects a PUT whose content equals
 * the stored file ("Cannot write without changing anything", HTTP 400), so the
 * Commit button is disabled while this is false. Injected defaults count as a
 * change (the displayed document differs from the stored file) — committing
 * them is a legitimate "heal" of the entity.
 */
export function hasUncommittedChanges(): boolean {
  return editingState.entityYAML != null && editingState.entityYAML !== editingState.initialYAML;
}

/** Recompute + push the change state to the view (cheap; React bails on equal). */
export function emitChangeState() {
  changeListener?.(hasUncommittedChanges());
}

export function getEntityName() {
  return editingState.entityName;
}

export function setEntityName(v: Nullable<string>) {
  editingState.entityName = v;
}

export function setActivatedActions(v: ActionDecl[]) {
  editingState.activatedActions = v;
}

export function getActivatedActions() {
  return editingState.activatedActions;
}

export function setIsValidatingCallback(cb: (v: boolean) => void) {
  editingState._setIsValidating = cb;
}

export function setIsValidating(v: boolean) {
  return editingState._setIsValidating(v);
}

export function setErrorMessageCallback(cb: (v: string) => void) {
  editingState._setErrorMessage = cb;
}

export function setErrorMessage(v: string) {
  return editingState._setErrorMessage(v);
}
