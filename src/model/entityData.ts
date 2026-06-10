import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { EntityData, TYPE_CHECK_ENTITY_DATA } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse } from './utils/handleYacResponse';

export async function getEntityData(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityData | null> {
  const url: string | null | undefined = requestContext.yacURL;
  if (url == null || url == undefined) return null;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}`),
    'GET',
  );

  if (resp == null) {
    showError('Network Error', `No data for the entity ${entityName} could be fetched.`);
    return null;
  }

  const result = await handleYacResponse(resp, {
    backendTitle: requestContext.backendObject?.title,
    errorTitle: `Could not fetch entity data for ${entityName}`,
    errorMessage: 'Could not fetch entity data. Please contact the admin to resolve this issue.',
  });

  if (result.kind === 'success') {
    return typeCheckEntityData(await result.resp.json(), entityName);
  } else if (result.kind === 'invalid-request') {
    // No validation error should happen here.
    showError('Internal Error', 'Error ID-VAL-GED-01. Please file a bug report!');
  } else if (result.kind === 'client-error') {
    showError('Cannot fetch schema', `Server responded with "${result.body.message}"`);
  }
  return null;
}

function typeCheckEntityData(ed: unknown, entityName: string): Nullable<EntityData> {
  if (typeCheck(TYPE_CHECK_ENTITY_DATA, ed)) {
    return ed as EntityData;
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching information of ${entityName}.`,
  );
  return null;
}
