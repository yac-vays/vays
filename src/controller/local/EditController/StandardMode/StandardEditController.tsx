import { invalidateEntityListCache, NameGeneratedCond } from '../../../../model/EntityListFetcher';
import {
  createNewEntity,
  patchEntity,
  validate,
  ValidateResponse,
} from '../../../../model/ValidatorClient';
import { extractPatch, removeOldData } from '../../../../schema/dataUtils';
import { mergeDefaults, updateDefaults } from '../../../../schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../../schema/injectActions';
import {
  hasSettableName,
  injectSettableName,
  popSettableName,
} from '../../../../schema/injectName';
import { Nullable } from '../../../../utils/typeUtils';
import { showModalMessage } from '../../../global/ModalController';
import { navigateToURL, RequestContext, RequestEditContext } from '../../../global/URLValidation';
import editingState from '../../../state/EditCtrlState';
import { showError } from '../../ErrorNotifyController';
import { editViewNavigateToNewName, setYACValidateResponse, setYACValidStatus } from '../shared';

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
  // if (INJECTED_NAME_PROPETRY in data){
  //     name = data[INJECTED_NAME_PROPETRY] as string;
  //     delete data[INJECTED_NAME_PROPETRY];
  // }
  console.error(
    'Edit Controller [Updating updateSchema]: Received request to update the schema. Received data is:',
  );

  console.log(JSON.stringify(data));
  console.log(name);
  console.log(editingState.initialData);

  // Send patch only in the modification mode.
  if (requestEditContext.mode === 'modify') {
    frontDataNoName = data;
    data = extractPatch(editingState.initialData, data);
  }

  const editActions = popActions(data, requestEditContext.rc);

  console.log('--> Sending!');
  console.log(JSON.stringify(data));

  let valResp: Nullable<ValidateResponse> = await validate(
    name,
    data,
    requestEditContext,
    editActions,
  );
  console.log('--> Receiving');
  console.log(JSON.stringify(valResp));
  if (valResp == null) return null;
  valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  console.log('Edit controller: The response was received.');
  setYACValidateResponse(valResp.detail);
  setYACValidStatus(valResp.valid);
  let didChange = false;

  console.log(JSON.stringify(frontData));
  if (requestEditContext.mode === 'modify') {
    console.log('Edit controller: Going into branch modify.');
    valResp.data = frontDataNoName!; //frontData;
    didChange = mergeDefaults(valResp);
  } else {
    console.log('Edit controller: Going into general branch.');
    didChange = updateDefaults(valResp);
  }
  // Note: seperate calculate and store here, avoiding short circuiting.
  console.log(didChange);
  console.log(valResp);
  console.log(JSON.stringify(valResp));
  console.log('The data before removing:');
  console.log(valResp.data);
  const didRemove = cleanData(valResp);
  console.log('The data after removing');
  console.log(valResp.data);
  didChange ||= didRemove;
  console.log(valResp);

  console.log(didChange);
  console.log(JSON.stringify(valResp.data));

  // do revalidation here!
  if (doRevalidate && didChange) {
    console.warn('REVALIDATION');
    if (requestEditContext.rc.accessedEntityType?.name_generated != NameGeneratedCond.enforced) {
      valResp = injectSettableName(valResp, requestEditContext.rc, name);
    }
    return await updateSchema(valResp.data, requestEditContext, false);
  }

  if (requestEditContext.rc.accessedEntityType?.name_generated == NameGeneratedCond.enforced) {
    return valResp;
  }

  if (doNavigate) editViewNavigateToNewName(name, requestEditContext);
  console.log('Edit Controller [Updating updateSchema]: Received response is:');
  console.log(valResp);

  valResp = injectSettableName(valResp, requestEditContext.rc, name);
  console.log(JSON.stringify(valResp));
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
  console.log('GOT REQUEST TO SEND AN ENTITY DATA.');
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
      console.log('---> CONFIRM SUCCESS');
      if (requestContext.mode === 'create') {
        console.log('---> CREATE');
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
  let data = structuredClone(newData);
  let name: Nullable<string> = '';
  if (hasSettableName(data)) {
    name = popSettableName(data) ?? name;
    // name = data[INJECTED_NAME_PROPETRY] as string;
    // delete data[INJECTED_NAME_PROPETRY];
  } else {
    name = null;
  }
  return await createNewEntity(name, data, requestContext);
}

async function sendPatchEntity(data: any, requestContext: RequestEditContext): Promise<boolean> {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SEND PATCH');
  let name = '';
  if (hasSettableName(data)) {
    name = popSettableName(data) ?? name;
    // name = data[INJECTED_NAME_PROPETRY] as string;
    // delete data[INJECTED_NAME_PROPETRY];
  } else {
    return false;
  }
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> PATCH');

  console.log(requestContext);
  console.log(editingState.initialData);

  const ret = await patchEntity(name, extractPatch(editingState.initialData, data), requestContext);
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SEND PATCH');
  return ret;
}
