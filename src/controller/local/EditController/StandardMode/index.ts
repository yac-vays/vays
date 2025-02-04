import { showModalMessage } from '../../../global/modal';
import { navigateToURL } from '../../../global/url';
import { showError } from '../../notification';
import editingState from '../../../state/EditCtrlState';
import {
  editViewNavigateToNewName,
  getInitialEntityYAML,
  setYACValidateResponse,
  setYACValidStatus,
} from '../shared';
import { invalidateEntityListCache } from '../../../../model/entityList';
import { validate } from '../../../../model/validate';
import { patchEntity } from '../../../../model/patch';
import { createNewEntity } from '../../../../model/create';
import { extractPatch, removeOldData } from '../../../../utils/schema/dataUtils';
import { mergeDefaults, updateDefaults } from '../../../../utils/schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../../utils/schema/injectActions';
import {
  hasSettableName,
  injectSettableName,
  popSettableName,
} from '../../../../utils/schema/injectName';
import { NameGeneratedCond } from '../../../../utils/types/api';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { RequestContext, RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';

export async function updateSchema(
  frontData: { [key: string]: any },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  doNavigate: boolean = true,
) {
  const originalName = requestEditContext.entityName ?? null;
  let name: Nullable<string> = null;

  // If enforced then the name does not change so use the original name.
  if (requestEditContext.rc.accessedEntityType?.name_generated === NameGeneratedCond.enforced)
    name = originalName;

  // Need to clone it since it is being modified...
  let data = structuredClone(frontData);
  let frontDataNoName;

  name = popSettableName(data) ?? name;

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

  setYACValidateResponse(valResp.detail);
  setYACValidStatus(valResp.valid);
  let didChange = false;

  if (requestEditContext.mode === 'modify') {
    console.log('Edit controller: Going into branch modify.');
    valResp.data = frontDataNoName!; //frontData;
    didChange = mergeDefaults(valResp);
  } else {
    console.log('Edit controller: Going into general branch.');
    didChange = updateDefaults(valResp);
  }
  // Note: seperate calculate and store here, avoiding short circuiting.
  const didRemove = cleanData(valResp);
  didChange ||= didRemove;

  // do revalidation here!
  if (doRevalidate && didChange) {
    if (requestEditContext.rc.accessedEntityType?.name_generated != NameGeneratedCond.enforced) {
      valResp = injectSettableName(valResp, requestEditContext.rc, name);
    }
    return await updateSchema(valResp.data, requestEditContext, false);
  }

  if (requestEditContext.rc.accessedEntityType?.name_generated == NameGeneratedCond.enforced) {
    return valResp;
  }

  if (doNavigate) editViewNavigateToNewName(name, requestEditContext);

  valResp = injectSettableName(valResp, requestEditContext.rc, name);
  return valResp;
}

function cleanData(valResp: ValidateResponse) {
  try {
    const validate = editingState.ajv.compile(valResp.json_schema);
    validate(valResp.data);
    return removeOldData(valResp.data, validate.errors ?? []);
  } catch (e: any) {
    showError('Faulty YAC Config: Schema Error', e.toString());
    navigateToURL('/');
  }
  return false;
}

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
  // JSON.stringify(editingState.data).replaceAll(",", ",\n")
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

async function sendPatchEntity(data: any, requestContext: RequestEditContext): Promise<boolean> {
  let name = '';
  if (hasSettableName(data)) {
    name = popSettableName(data) ?? name;
  } else {
    return false;
  }

  const ret = await patchEntity(
    name,
    extractPatch(editingState.initialData, data),
    requestContext,
    getInitialEntityYAML(),
  );
  return ret;
}
