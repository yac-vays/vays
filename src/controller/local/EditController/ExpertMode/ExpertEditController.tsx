import { invalidateEntityListCache } from '../../../../model/EntityListFetcher';
import { createNewEntity, putYAMLEntity, validateYAML } from '../../../../model/ValidatorClient';
import { Nullable } from '../../../../utils/typeUtils';
import { showModalMessage } from '../../../global/ModalController';
import { navigateToURL, RequestContext, RequestEditContext } from '../../../global/URLValidation';
import editingState from '../../../state/EditCtrlState';
import { showError } from '../../ErrorNotifyController';
import { setYACValidateResponse, setYACValidStatus } from '../shared';
import { getEntityName, getEntityYAML, getOldYAML, setEntityName } from './EditorState';

export async function updateYAMLschema(
  name: Nullable<string>,
  yaml: string,
  requestEditContext: RequestEditContext,
) {
  const valResp = await validateYAML(requestEditContext, name, yaml, editingState.initialYAML);
  if (valResp == null) return;
  setYACValidateResponse(valResp.detail);
  setYACValidStatus(valResp.valid);

  return valResp;
}

export function sendYAMLData(requestContext: RequestEditContext) {
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
      if (requestContext.mode === 'create') {
        success = await sendCreateNewEntity(getEntityYAML() ?? '', requestContext.rc);
      } else {
        success = await sendPutEntity(getEntityYAML() ?? getOldYAML(), requestContext);
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

async function sendCreateNewEntity(
  yaml: string | undefined,
  requestContext: RequestContext,
): Promise<boolean> {
  let name: Nullable<string> = getEntityName();
  setEntityName(null);
  return await createNewEntity(name, {}, requestContext, yaml);
}

async function sendPutEntity(
  yaml: string,
  requestEditContext: RequestEditContext,
): Promise<boolean> {
  let name: string | undefined = getEntityName() ?? requestEditContext.entityName;
  if (name == undefined) {
    showError('Could not send the update!', '');
    return false;
  }
  return await putYAMLEntity(name, yaml, getOldYAML(), requestEditContext);
}
