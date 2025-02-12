/* eslint-disable @typescript-eslint/no-explicit-any */
import { createNewEntity } from '../../../../model/create';
import { invalidateEntityListCache } from '../../../../model/entityList';
import { patchEntity } from '../../../../model/patch';
import { validate } from '../../../../model/validate';
import { isNameGeneratedByYAC } from '../../../../utils/nameUtils';
import { extractPatch, removeOldData } from '../../../../utils/schema/dataUtils';
import { mergeDefaults, updateDefaults } from '../../../../utils/schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../../utils/schema/injectActions';
import {
  hasSettableName,
  injectSettableName,
  popSettableName,
} from '../../../../utils/schema/injectName';
import { NameGeneratedCond } from '../../../../utils/types/api';
import { RequestContext, RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { showModalMessage } from '../../../global/modal';
import { navigateToURL } from '../../../global/url';
import editingState from '../../../state/EditCtrlState';
import { showError } from '../../notification';
import { editViewNavigateToNewName, getAJV, getInitialEntityYAML, setYACStatus } from '../shared';

export async function updateSchema(
  frontData: { [key: string]: any },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  doNavigate: boolean = true,
) {
  // Need to clone it since it is being modified...
  let data = structuredClone(frontData);
  let frontDataNoName;

  const originalName = requestEditContext.entityName ?? null;
  let name: Nullable<string> = null;

  // If enforced then the name does not change so use the original name.
  if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) name = originalName;
  else name = popSettableName(data) ?? name;

  // Send patch only in the modification mode.
  if (requestEditContext.mode === 'modify') {
    frontDataNoName = data;
    data = extractPatch(editingState.initialData, data);
  }

  const editActions = popActions(data, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await validate(
    name,
    data,
    requestEditContext,
    editActions,
  );
  if (valResp == null) return null;
  valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);

  setYACStatus(valResp.valid, valResp.detail);
  const didChange = handleDefaults(frontDataNoName, valResp, requestEditContext);

  // do revalidation here!
  // See ephemeral property problem.
  if (doRevalidate && didChange) {
    if (requestEditContext.rc.accessedEntityType?.name_generated != NameGeneratedCond.enforced) {
      valResp = injectSettableName(valResp, requestEditContext.rc, name);
    }
    return await updateSchema(valResp.data, requestEditContext, false);
  }

  updateURL(name, doNavigate, requestEditContext);

  return injectMetaData(name, valResp, requestEditContext);
}

/**
 * Checks whether some defaults have been changed.
 * Will save the current default object to the state.
 *
 * For new entities, the old defaults are removed all.
 * For modification
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

  if (requestEditContext.mode === 'modify') {
    console.log('Edit controller: Going into branch modify.');
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
 * @returns
 */
function cleanData(valResp: ValidateResponse) {
  try {
    const validate = getAJV().compile(valResp.json_schema);
    validate(valResp.data);
    return removeOldData(valResp.data, validate.errors ?? []);
  } catch (e: any) {
    showError('Faulty YAC Config: Schema Error', e.toString());
    navigateToURL('/');
  }
  return false;
}

/**
 * Inject name if necessary.
 *
 * @param name
 * @param valResp
 * @param requestEditContext
 * @returns
 */
function injectMetaData(
  name: Nullable<string>,
  valResp: ValidateResponse,
  requestEditContext: RequestEditContext,
) {
  if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
    return valResp;
  }

  valResp = injectSettableName(valResp, requestEditContext.rc, name);
  return valResp;
}

/**
 * Update the URL, for the case that the user has, in the edit view, changed the name.
 * @param name
 * @param doNavigate
 * @param requestEditContext
 * @returns
 */
function updateURL(
  name: Nullable<string>,
  doNavigate: boolean,
  requestEditContext: RequestEditContext,
) {
  if (!doNavigate || isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) return;

  editViewNavigateToNewName(name, requestEditContext);
}

/**
 * Send Form Data, callback for the Edit View component.
 * @param requestContext
 * @returns
 */
export function sendFormData(requestContext: RequestEditContext) {
  if (!editingState.isValidYAC) {
    showModalMessage(
      'Data not valid',
      `The data is not yet valid. YAC server response is \n"${editingState.yacResponse}"`,
      async () => {},
      async () => {},
      'Return',
      false,
    );
    return;
  }
  showModalMessage(
    'Are You Sure You Want to Send the Data?',
    '',
    async () => {
      let success = false;
      if (requestContext.mode === 'create') {
        success = await sendCreateNewEntity(editingState.entityDataObject, requestContext.rc);
      } else {
        success = await sendPatchEntity(editingState.entityDataObject, requestContext);
      }

      if (success) {
        invalidateEntityListCache(requestContext.rc.yacURL, requestContext.rc.entityTypeName);
        navigateToURL(
          `${requestContext.rc.backendObject?.name}/${requestContext.rc.entityTypeName}`,
        );
      }
    },
    async () => {},
    'Confirm',
    false,
  );
}

/**
 * Small helper function which takes the new data and tells the model to send a new entity request.
 * @param newData
 * @param requestContext
 * @returns
 */
async function sendCreateNewEntity(newData: any, requestContext: RequestContext): Promise<boolean> {
  const data = structuredClone(newData);
  let name: Nullable<string> = '';
  if (hasSettableName(data)) {
    name = popSettableName(data) ?? name;
  } else {
    name = null;
  }
  return await createNewEntity(name, data, requestContext);
}

/**
 * Small helper function which takes the enitre data and tells the model to send a modification request.
 * @param data.
 * @param requestEditContext
 * @returns
 */
async function sendPatchEntity(
  data: any,
  requestEditContext: RequestEditContext,
): Promise<boolean> {
  let name = '';
  data = structuredClone(data); // may be changed and patch may not succeed (collision)
  if (hasSettableName(data)) {
    name = popSettableName(data) ?? name;
  } else if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
    if (requestEditContext.entityName == null) return false;
    name = requestEditContext.entityName;
  } else {
    return false;
  }

  const ret = await patchEntity(
    name,
    extractPatch(editingState.initialData, data),
    requestEditContext,
    getInitialEntityYAML(),
  );
  return ret;
}
