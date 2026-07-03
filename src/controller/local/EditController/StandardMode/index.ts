/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNameGeneratedByYAC } from '../../../../utils/nameUtils';
import { EditActionSnapshot } from '../../../../utils/schema/injectActions';
import { ActionDecl } from '../../../../utils/types/api';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import { getActivatedActions, getEntityName } from '../ExpertMode/access';
import { coreUpdate, editViewNavigateToNewName } from '../shared';

/**
 * Build an `EditActionSnapshot` (all active) from the action declarations chosen
 * in the MetaInfoPanel. Only `action.name` + `dataEntryValue` are read downstream
 * (via `dumpEditActions`), so synthetic keys are fine.
 */
function actionsToSnapshot(acts: ActionDecl[]): EditActionSnapshot {
  const snapshot: EditActionSnapshot = {};
  acts.forEach((action, idx) => {
    snapshot[`a${idx}`] = { action, dataEntryValue: true };
  });
  return snapshot;
}

/**
 * Validate the form's entity data and return the (possibly re-generated) schema.
 *
 * The name + triggerable actions are NOT part of the form data: they live in the
 * always-visible MetaInfoPanel and are read from the controller state here, so
 * the form data stays a pure entity-data object that mirrors the YAML pane.
 *
 * @param frontData The current form data object.
 * @param requestEditContext The request/edit context.
 * @param doRevalidate Whether to re-validate until the data stabilizes.
 * @param doNavigate Whether to update the URL when the (create) name changes.
 * @param entityName Fallback name (used when none is set in the MetaInfoPanel).
 */
export async function updateSchema(
  frontData: { [key: string]: any },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  doNavigate: boolean = true,
  entityName: Nullable<string> = null,
  // The YAML the user is editing; merged with the form patch so comments survive
  // (see `validate`). Omit on initial loads.
  yamlBase?: string,
  // The validation-seq stamp of the user edit driving this update (see
  // `coreUpdate`): a newer stamped edit stops the stabilization chain early.
  seq?: number,
) {
  // Need to clone it since it is being modified...
  const data = structuredClone(frontData);

  const name = isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)
    ? (requestEditContext.entityName ?? null)
    : (getEntityName() ?? entityName);
  const editActions = actionsToSnapshot(getActivatedActions());

  const valResp = await coreUpdate(
    data,
    requestEditContext,
    doRevalidate,
    editActions,
    name,
    yamlBase,
    seq,
  );
  if (valResp == null) return null;

  updateURL(name, doNavigate, requestEditContext);

  return valResp;
}

/**
 * Update the URL when the user changed the (settable) name while creating.
 * @param name
 * @param doNavigate
 * @param requestEditContext
 */
function updateURL(
  name: Nullable<string>,
  doNavigate: boolean,
  requestEditContext: RequestEditContext,
) {
  if (!doNavigate || isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) return;

  editViewNavigateToNewName(name, requestEditContext);
}
