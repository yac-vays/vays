/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import editingState from '../../state/EditCtrlState';
import { getEntityYAML, setEntityYAML } from './ExpertMode/access';
import { updateSchema } from './StandardMode';

/**
 * Side-by-side editor synchronization.
 *
 * The form and the YAML editor are two *views* of one canonical `{data, yaml}`
 * pair, which is produced by YAC's `/validate` endpoint (it returns both the
 * normalized data and the ruamel-serialized YAML, comments preserved). The pane
 * the user is editing (`origin`) is authoritative and is never overwritten while
 * focused; only the *other* (inactive) pane is rewritten from the canonical
 * projection.
 *
 * This module is the single bridge between the two pane implementations (the
 * JSON Forms component and the Monaco editor), which otherwise live in separate
 * controllers. Each pane registers a "writer" that knows how to render a
 * `ValidateResponse` into itself; `applyCanonical` calls the opposite pane's
 * writer.
 */

export type Pane = 'form' | 'yaml';

/** Renders a validation response into a pane (schema + data/text). */
export type PaneWriter = (resp: ValidateResponse) => void;

let formWriter: PaneWriter | null = null;
let yamlWriter: PaneWriter | null = null;

export function registerFormWriter(cb: PaneWriter | null) {
  formWriter = cb;
}

export function registerYamlWriter(cb: PaneWriter | null) {
  yamlWriter = cb;
}

/** Whether the YAML pane is currently mounted (its writer is registered). */
export function hasYamlPane(): boolean {
  return yamlWriter != null;
}

/** Whether the form pane is currently mounted (its writer is registered). */
export function hasFormPane(): boolean {
  return formWriter != null;
}

export function setActivePane(p: Pane | null) {
  editingState.activePane = p;
}

export function getActivePane(): Pane | null {
  return editingState.activePane;
}

/**
 * Seed the canonical pair at initialization time (before the user edits), so a
 * pane's own initial `setValue` is recognized as "already canonical" and does
 * not trigger a redundant validation round-trip.
 */
export function seedCanonical(data: any, yaml: string) {
  editingState.canonicalData = data;
  editingState.canonicalYAML = yaml;
  // Also the live editor-YAML string, so the very first form edit has the
  // initial document (e.g. the create defaults template) as its merge base.
  setEntityYAML(yaml);
}

export function getCanonicalYAML(): string {
  return editingState.canonicalYAML;
}

export function getCanonicalData(): any {
  return editingState.canonicalData;
}

/**
 * Stamp a new validation dispatch. Callers keep the returned id and pass it to
 * {@link isStaleValidation} when their response resolves.
 */
export function nextValidationSeq(): number {
  return ++editingState.validationSeq;
}

/** True if a newer validation has been dispatched since `seq` (drop the response). */
export function isStaleValidation(seq: number): boolean {
  return seq < editingState.validationSeq;
}

/** Consume the form's programmatic-write guard (true => ignore this change). */
export function consumeFormSuppression(): boolean {
  if (editingState.suppressNextFormChange) {
    editingState.suppressNextFormChange = false;
    return true;
  }
  return false;
}

/** Consume the YAML's programmatic-write guard (true => ignore this change). */
export function consumeYamlSuppression(): boolean {
  if (editingState.suppressNextYamlChange) {
    editingState.suppressNextYamlChange = false;
    return true;
  }
  return false;
}

/**
 * Store the canonical pair from a validation and project it into the inactive
 * pane. The pane that initiated the edit (`origin`) is left untouched so the
 * user's cursor/text survives; the opposite pane is rewritten. The cross-pane
 * write sets a suppression flag so the resulting change event does not loop
 * back into another validation.
 *
 * @param origin Which pane produced this validation.
 * @param resp   The canonical validation response (includes `data` and `yaml`).
 */
export function applyCanonical(origin: Pane, resp: ValidateResponse) {
  editingState.canonicalData = resp.data;
  if (resp.yaml != null) {
    editingState.canonicalYAML = resp.yaml;
    // Keep the YAML save payload (`getEntityYAML`) current no matter which pane
    // produced the change, so a single PUT-of-canonical-YAML save path works.
    setEntityYAML(resp.yaml);
  }

  if (origin === 'form') {
    if (resp.yaml != null && yamlWriter) {
      editingState.suppressNextYamlChange = true;
      yamlWriter(resp);
    }
  } else {
    if (formWriter) {
      editingState.suppressNextFormChange = true;
      formWriter(resp);
    }
  }
}

/** Store the canonical pair and refresh BOTH panes (used for meta changes). */
function writeBothPanes(resp: ValidateResponse) {
  editingState.canonicalData = resp.data;
  if (resp.yaml != null) {
    editingState.canonicalYAML = resp.yaml;
    setEntityYAML(resp.yaml);
  }
  if (formWriter) {
    editingState.suppressNextFormChange = true;
    formWriter(resp);
  }
  if (resp.yaml != null && yamlWriter) {
    editingState.suppressNextYamlChange = true;
    yamlWriter(resp);
  }
}

/**
 * Re-validate the current data after a name/action change in the always-visible
 * MetaInfoPanel (toggling an action can change the schema) and refresh both
 * panes from the result. Name/actions are read from the controller state (set
 * by the panel) inside `updateSchema`.
 */
export async function revalidateMeta(requestEditContext: RequestEditContext) {
  const seq = nextValidationSeq();
  // Keep the editor's comments/formatting when an action toggle re-validates.
  const resp = await updateSchema(
    getCanonicalData(),
    requestEditContext,
    true,
    true,
    null,
    getEntityYAML(),
  );
  if (resp == null || isStaleValidation(seq)) return;
  writeBothPanes(resp);
}
