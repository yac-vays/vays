/* eslint-disable @typescript-eslint/no-explicit-any */
import { createNewEntity } from '../../../../model/create';
import { invalidateEntityListCache } from '../../../../model/entityList';
import { patchEntity } from '../../../../model/patch';
import { isNameGeneratedByYAC } from '../../../../utils/nameUtils';
import { extractPatch } from '../../../../utils/schema/dataUtils';
import {
  dumpEditActions,
  injectAction,
  insertActionData,
  popActions,
} from '../../../../utils/schema/injectActions';
import { hasSettableName, popSettableName } from '../../../../utils/schema/injectName';
import { RequestContext, RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import { showModalMessage } from '../../../global/modal';
import { navigateToURL } from '../../../global/url';
import editingState from '../../../state/EditCtrlState';
import {
  coreUpdate,
  editViewNavigateToNewName,
  getInitialEntityYAML,
  injectMetaData,
} from '../shared';
import { getLocalEntityData } from './access';

/**
 * Expects the schema to contain the actions, optionally also the name, if not entered.
 *
 *
 * @param frontData
 * @param requestEditContext
 * @param doRevalidate
 * @param doNavigate
 * @returns The updated schema. It will also insert the name and the actions into the data and schema.
 */
export async function updateSchema(
  frontData: { [key: string]: any },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  doNavigate: boolean = true,
  entityName: Nullable<string> = null,
) {
  // Need to clone it since it is being modified...
  const data = structuredClone(frontData);

  const originalName = requestEditContext.entityName ?? null;
  let name: Nullable<string> = entityName;

  // If enforced then the name does not change so use the original name.
  if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) name = originalName;
  else name = popSettableName(data) ?? name;

  const editActions = popActions(data, requestEditContext.rc);
  let valResp = await coreUpdate(data, requestEditContext, doRevalidate, editActions, name);

  if (valResp == null) return null;
  valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);

  updateURL(name, doNavigate, requestEditContext);

  return injectMetaData(name, valResp, requestEditContext, true);
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
export function sendFormData(requestEditContext: RequestEditContext) {
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
      if (requestEditContext.mode === 'create') {
        success = await sendCreateNewEntity(getLocalEntityData(), requestEditContext.rc);
      } else {
        success = await sendPatchEntity(getLocalEntityData(), requestEditContext);
      }

      if (success) {
        onSuccessfullPatch(requestEditContext);
      }
    },
    async () => {},
    'Confirm',
    false,
  );
}

/**
 * Execute after successfully executing a patch call.
 * @param requestEditContext
 */
export function onSuccessfullPatch(requestEditContext: RequestEditContext) {
  invalidateEntityListCache(requestEditContext.rc.yacURL, requestEditContext.rc.entityTypeName);
  navigateToURL(
    `${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}`,
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
  const editActions = dumpEditActions(popActions(data, requestContext));
  return await createNewEntity(name, data, requestContext, undefined, editActions);
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
  data = structuredClone(data); // will be changed and patch may not succeed (collision)
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
