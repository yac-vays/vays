import Ajv from 'ajv';
import { getEntityData } from '../../../model/entityData';
import { getSchema } from '../../../model/validate';
import { isNameGeneratedByYAC } from '../../../utils/nameUtils';
import { insertDefaults, mergeDefaults } from '../../../utils/schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../utils/schema/injectActions';
import { injectSettableName } from '../../../utils/schema/injectName';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import { navigateToURL } from '../../global/url';
import editingState from '../../state/EditCtrlState';
import { updateSchema } from './StandardMode';

/**
 * Reset internal status storing the most recent YAC response (the one
 * which is also displayed in the footer of the edit view)
 */
export function clearYACStatus() {
  setYACValidateResponse('');
  setYACValidStatus(true);
}

export function setYACStatus(valid: boolean, detail: string) {
  setYACValidateResponse(detail);
  setYACValidStatus(valid);
}

/**
 * Get some schema.
 * @param requestEditContext
 * @param preventInjectName
 * @param preventInjectActions
 * @param [startEditingSession=true] Whether to start an editing session. If true, this will set the
 *    state for the initial data and yaml received, which may be needed when finishing the session (e.g.
 *    to calculate the patch or to handle a concurrency collision.)
 * @returns
 */
export async function retreiveSchema(
  requestEditContext: RequestEditContext,
  insertName: boolean = true,
  insertAction: boolean = true,
  startEditingSession: boolean = true,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;

  if (requestEditContext.mode === 'create') {
    return await retreiveNewCreateSchema(requestEditContext);
  }

  return await retreiveEditSchema(
    requestEditContext,
    insertName,
    insertAction,
    startEditingSession,
  );
}

/**
 * Get the editing schema.
 *
 * @param requestEditContext
 * @param insertName
 * @param insertAction
 * @returns
 *
 *
 * @satisfies - Will store the defaults object in the case of creating a new entity.
 */
async function retreiveEditSchema(
  requestEditContext: RequestEditContext,
  insertName: boolean = true,
  insertAction: boolean = true,
  startEditingSession: boolean = true,
): Promise<ValidateResponse | null> {
  if (requestEditContext.entityName == null) return null;

  const entityData = await getEntityData(requestEditContext.entityName, requestEditContext.rc);
  if (entityData == null) {
    return null;
  }
  const editActions = popActions({}, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext, editActions);
  if (valResp == null) {
    return null;
  }
  if (insertAction) {
    valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  }
  valResp.yaml = entityData.yaml;
  valResp.data = entityData?.data;

  if (startEditingSession) {
    setInitialEntityYAML(entityData.yaml);
    editingState.initialData = structuredClone(valResp.data);
  }

  mergeDefaults(valResp);
  // const v = await updateSchema(valResp.data, requestEditContext, false, false);
  // if (!insertName){

  // }
  if (!insertName || isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
    return valResp;
  }

  return injectSettableName(valResp, requestEditContext.rc, requestEditContext.entityName);
}

/**
 * Get the create schema.
 * @param requestEditContext
 * @returns
 */
async function retreiveNewCreateSchema(
  requestEditContext: RequestEditContext,
): Promise<ValidateResponse | null> {
  const editActions = popActions({}, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext, editActions);
  if (valResp == null) {
    return null;
  }

  // if (!preventInjectActions) {
  valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  // }

  insertDefaults(valResp);

  return await updateSchema(valResp.data, requestEditContext, false, false);
}

/**
 * Update URL to include the new name.
 * Should only be called for the create mode. (will not do anything for editing.)
 * @param name
 * @param requestEditContext
 */
export function editViewNavigateToNewName(
  name: Nullable<string>,
  requestEditContext: RequestEditContext,
) {
  if (
    requestEditContext.mode == 'create' &&
    // This fixes the latent redirect when the user just navigated away
    window.location.pathname.startsWith(
      `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}`,
    )
  ) {
    if (name != null) {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/${name}?mode=${requestEditContext.viewMode}`,
      );
    } else {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/?mode=${requestEditContext.viewMode}`,
      );
    }
  }
}

export function setYACValidateResponse(yacResponse: string) {
  editingState.yacResponse = yacResponse;
}

export function setYACValidStatus(valid: boolean) {
  editingState.isValidYAC = valid;
}

export function getYACValidateResponse() {
  return editingState.yacResponse;
}

export function getInitialEntityYAML() {
  return editingState.initialYAML;
}

export function setInitialEntityYAML(yaml: string) {
  editingState.initialYAML = yaml;
}

export function getPreviousDefaultsObject() {
  return editingState.previousDefaultsObject;
}

export function setPreviousDefaultsObject(data: unknown) {
  editingState.previousDefaultsObject = data;
}

export function getAJV(): Ajv {
  return editingState.ajv;
}
