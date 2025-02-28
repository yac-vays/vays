/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { getEntityData } from '../../../model/entityData';
import { getSchema, validate } from '../../../model/validate';
import { isNameGeneratedByYAC } from '../../../utils/nameUtils';
import { extractPatch, getAllErrors, removeOldData } from '../../../utils/schema/dataUtils';
import {
  insertDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../../utils/schema/defaultsHandling';
import {
  EditActionSnapshot,
  injectAction,
  insertActionData,
  NO_ACTIONS,
  popActions,
} from '../../../utils/schema/injectActions';
import { injectSettableName } from '../../../utils/schema/injectName';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import { showError } from '../../global/notification';
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

  let valResp = await coreUpdate(
    entityData.data,
    requestEditContext,
    true,
    NO_ACTIONS,
    requestEditContext.entityName,
  );

  if (valResp == null) {
    return null;
  }
  if (insertAction) {
    valResp = insertActionData(injectAction(valResp, requestEditContext), NO_ACTIONS);
  }

  if (startEditingSession) {
    setInitialEntityYAML(entityData.yaml);
    editingState.initialData = structuredClone(entityData.data);
  }

  valResp.yaml = entityData.yaml;

  return injectMetaData(requestEditContext.entityName, valResp, requestEditContext, insertName);
  // if (!insertName || isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
  //   return valResp;
  // }

  // return injectSettableName(valResp, requestEditContext.rc, requestEditContext.entityName);
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

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext);
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

/**
 * Inject name if necessary.
 *
 * @param name
 * @param valResp
 * @param requestEditContext
 * @returns
 */
export function injectMetaData(
  name: Nullable<string>,
  valResp: ValidateResponse,
  requestEditContext: RequestEditContext,
  injectName: boolean,
) {
  if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType) || !injectName) {
    return valResp;
  }
  valResp = injectSettableName(valResp, requestEditContext.rc, name);
  return valResp;
}

/**
 * Subroutine which performs as many validates as it
 * is necessary to stabilize out the data object. That is, it validates and if new parameters
 * with defaults appear or parameters are removed and the data needs to be cleared up.
 * @param entityData
 * @param requestEditContext
 * @param doRevalidate
 * @param editActions
 * @param name
 * @returns
 *
 * @note Internal (controller) use only.
 */
export async function coreUpdate(
  entityData: { [key: string]: unknown },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  editActions: EditActionSnapshot,
  name: Nullable<string>,
) {
  let data = entityData;
  if (requestEditContext.mode === 'change') {
    data = extractPatch(editingState.initialData, data);
  }

  const valResp: Nullable<ValidateResponse> = await validate(
    name,
    data,
    requestEditContext,
    editActions,
  );
  if (valResp == null) return null;

  setYACStatus(valResp.valid, valResp.detail);
  const didChange = handleDefaults(entityData, valResp, requestEditContext);

  // do revalidation here!
  // See ephemeral property problem.
  if (doRevalidate && didChange) {
    return await coreUpdate(valResp.data, requestEditContext, doRevalidate, editActions, name);
  }
  return valResp;
}

/**
 * Checks whether some defaults have been changed.
 * Will save the current default object to the state.
 *
 *
 * @param previousData
 * @param valResp
 * @param requestEditContext
 * @returns
 */
function handleDefaults(
  previousData: any,
  valResp: ValidateResponse,
  requestEditContext: RequestEditContext,
) {
  let didChange = false;

  if (requestEditContext.mode === 'change') {
    console.log('Edit controller: Going into branch change.');
    valResp.data = previousData; //frontData;
    didChange = mergeDefaults(valResp);
  } else {
    console.log('Edit controller: Going into general branch.');
    didChange = updateDefaults(valResp);
  }
  // Note: seperate calculate and store here, avoiding short circuiting.
  const didRemove = cleanData(valResp);
  didChange ||= didRemove;
  return didChange;
}

/**
 * Removes the data which is no longer allowed by the new schema.
 * This is necessary due to `yac_if`.
 * @param valResp
 * @returns Whether the data object has been altered.
 */
function cleanData(valResp: ValidateResponse): boolean {
  return removeOldData(
    valResp.data,
    getAllErrors(valResp.data, valResp.json_schema, getAJV(), (e: any) => {
      showError('Faulty YAC Config: Schema Error', e.toString());
      navigateToURL('/');
    }),
  );
}
