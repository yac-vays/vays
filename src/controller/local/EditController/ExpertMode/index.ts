import { createNewEntity } from '../../../../model/create';
import { invalidateEntityListCache } from '../../../../model/entityList';
import { putYAMLEntity } from '../../../../model/put';
import { validateYAML } from '../../../../model/validate';
import { getActionNames } from '../../../../utils/actionUtils';
import { ActionDecl } from '../../../../utils/types/api';
import { RequestContext, RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { showModalMessage } from '../../../global/modal';
import { showError } from '../../../global/notification';
import { navigateToURL } from '../../../global/url';
import editingState from '../../../state/EditCtrlState';
import { clearYACStatus, getInitialEntityYAML, setYACStatus } from '../shared';
import {
  getActivatedActions,
  getEntityName,
  getEntityYAML,
  setActivatedActions,
  setCurrentContext,
  setEntityName,
  setErrorMessageCallback,
  setIsValidatingCallback,
} from './access';

/**
 * Send validation for the yaml.
 * @param name
 * @param yaml
 * @param requestEditContext
 * @returns
 */
export async function updateYAMLschema(
  name: Nullable<string>,
  yaml: string,
  requestEditContext: RequestEditContext,
  acts: ActionDecl[],
): Promise<Nullable<ValidateResponse>> {
  const valResp = await validateYAML(requestEditContext, name, yaml, getInitialEntityYAML(), acts);
  if (valResp == null) return null;
  setYACStatus(valResp.valid, valResp.detail);

  return valResp;
}

/**
 * Callback for the edit view.
 * @param requestContext
 * @returns
 */
export function sendYAMLData(requestContext: RequestEditContext) {
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
        success = await sendPutEntity(getEntityYAML() ?? getInitialEntityYAML(), requestContext);
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
 * Helper function which tells the model to send a new entity request.
 * @param yaml
 * @param requestContext
 * @returns
 */
async function sendCreateNewEntity(
  yaml: string | undefined,
  requestContext: RequestContext,
): Promise<boolean> {
  const name: Nullable<string> = getEntityName();
  setEntityName(null);
  return await createNewEntity(
    name,
    {},
    requestContext,
    yaml,
    getActionNames(getActivatedActions()),
  );
}

/**
 * Helper function which tells the model to send a put API call.
 * @param yaml
 * @param requestEditContext
 * @returns
 */
async function sendPutEntity(
  yaml: string,
  requestEditContext: RequestEditContext,
): Promise<boolean> {
  const name: string | undefined = getEntityName() ?? requestEditContext.entityName;
  if (name == undefined) {
    showError('Could not send the update!', '');
    return false;
  }
  return await putYAMLEntity(
    name,
    yaml,
    getInitialEntityYAML(),
    requestEditContext,
    getActionNames(getActivatedActions()),
  );
}

/**
 * Initializes the internal state for a new expert mode editing session.
 * @param requestEditContext
 * @param setIsValidating
 * @param setEditErrorMsg
 */
export function startExpertModeSession(
  requestEditContext: RequestEditContext,
  setIsValidating: (v: boolean) => void,
  setEditErrorMsg: (v: string) => void,
) {
  clearYACStatus();
  setActivatedActions([]);
  if (requestEditContext.mode == 'change') setEntityName(requestEditContext.entityName ?? null);
  else setEntityName(null);
  setCurrentContext(requestEditContext);
  setIsValidatingCallback(setIsValidating);
  setErrorMessageCallback(setEditErrorMsg);

  setEditErrorMsg(''); // Start with no error message, please
}
