/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActionNames } from '../../../../utils/actionUtils';
import { isNameGeneratedByYAC } from '../../../../utils/nameUtils';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import { getActivatedActions, getEntityName } from '../editState';
import { coreUpdate } from '../stabilize';

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
 * @param entityName Fallback name (used when none is set in the MetaInfoPanel).
 */
export async function validateFormData(
  frontData: { [key: string]: any },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
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
  return await coreUpdate(data, requestEditContext, {
    doRevalidate,
    actions: getActionNames(getActivatedActions()),
    name,
    yamlBase,
    seq,
  });
}
