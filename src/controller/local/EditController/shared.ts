/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { getEntityData } from '../../../model/entityData';
import { getSchema, validate } from '../../../model/validate';
import { extractPatch, getAllErrors, removeOldData } from '../../../utils/schema/dataUtils';
import {
  insertDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../../utils/schema/defaultsHandling';
import { EditActionSnapshot, NO_ACTIONS } from '../../../utils/schema/injectActions';
import { LimitUsage } from '../../../utils/types/api';
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
  setLocalValidity(true);
  setYACUsages([]);
  emitValidity();
}

export function setYACStatus(valid: boolean, detail: string, usages: LimitUsage[] = []) {
  setYACValidateResponse(detail);
  setYACValidStatus(valid);
  setYACUsages(usages);
  emitValidity();
}

/**
 * Reactive bridge for overall form validity, mirroring `usagesListener`. The
 * edit view (`EditFrame`) registers a listener to enable/disable the Commit
 * button. Validity combines the backend verdict (`isValidYAC`, from every
 * `setYACStatus`) with the form's own JSON Forms error count (`isValidLocal`,
 * pushed from the standard-mode `onChange`).
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
 * Reactive bridge for the `limits` usage indicator. Both edit modes funnel
 * their validation results through `setYACStatus`, so a single listener
 * registered by the edit view (`EditFrame`) receives every update for free.
 */
let usagesListener: ((usages: LimitUsage[]) => void) | null = null;

export function setUsagesListener(cb: ((usages: LimitUsage[]) => void) | null) {
  usagesListener = cb;
}

export function setYACUsages(usages: LimitUsage[]) {
  editingState.yacUsages = usages;
  usagesListener?.(usages);
}

/**
 * Get the schema (and validated data) for the current entity. Name + actions are
 * never injected into the schema/data: they live in the always-visible
 * MetaInfoPanel (see `view/.../ExpertMode/MetaInfoPanel`).
 *
 * @param requestEditContext
 * @param [startEditingSession=true] If true, records the initial data + YAML
 *    (the baseline used for the YAML diff and concurrency detection).
 */
export async function retreiveSchema(
  requestEditContext: RequestEditContext,
  startEditingSession: boolean = true,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;

  if (requestEditContext.mode === 'create') {
    return await retreiveNewCreateSchema(requestEditContext);
  }

  return await retreiveEditSchema(requestEditContext, startEditingSession);
}

/**
 * Get the editing schema for an existing entity.
 */
async function retreiveEditSchema(
  requestEditContext: RequestEditContext,
  startEditingSession: boolean = true,
): Promise<ValidateResponse | null> {
  if (requestEditContext.entityName == null) return null;

  const entityData = await getEntityData(requestEditContext.entityName, requestEditContext.rc);
  if (entityData == null) {
    return null;
  }

  const valResp = await coreUpdate(
    entityData.data,
    requestEditContext,
    true,
    NO_ACTIONS,
    requestEditContext.entityName,
  );

  if (valResp == null) {
    return null;
  }

  if (startEditingSession) {
    setInitialEntityYAML(entityData.yaml);
    editingState.initialData = structuredClone(entityData.data);
  }

  valResp.yaml = entityData.yaml;

  return valResp;
}

/**
 * Get the create schema for a new entity.
 */
async function retreiveNewCreateSchema(
  requestEditContext: RequestEditContext,
): Promise<ValidateResponse | null> {
  const valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext);
  if (valResp == null) {
    return null;
  }

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
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/${name}`,
      );
    } else {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/`,
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

  setYACStatus(valResp.valid, valResp.detail, valResp.usages);
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
