import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { handleAuthFailed } from '../session/login/tokenHandling';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { EntityData, TYPE_CHECK_ENTITY_DATA } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';

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

  if (resp.status == 200) return typeCheckEntityData(await resp.json(), entityName);
  else if (resp.status == 422) {
    // No validation error should happen here.
    showError('Internal Error', 'Error ID-VAL-GED-01. Please file a bug report!');
    return null;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Could not fetch entity data for ${entityName} (Status ${resp.status})`),
      ans.message ?? 'Could not fetch entity data. Please contact the admin to resolve this issue.',
    );
    return null;
  } else if (hasAuthFailed(resp.status)) {
    const ans = await resp.json();
    handleAuthFailed(ans.detail, ans.message);
    return null;
  }

  const message = (await resp.json()).message;
  showError('Cannot fetch schema', `Server responded with "${message}"`);
  return null;
}

function typeCheckEntityData(ed: unknown, entityName: string): Nullable<EntityData> {
  //return ed as EntityData;
  if (typeCheck(TYPE_CHECK_ENTITY_DATA, ed)) {
    return ed as EntityData;
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching information of ${entityName}.`,
  );
  return null;
}
