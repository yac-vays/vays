import { showError } from '../controller/local/notification';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { authFailed, sendRequest } from '../utils/authRequest';
import { EntityData } from '../utils/types/api';

export async function getEntityData(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityData | null> {
  const url: string | null | undefined = requestContext.yacURL;

  const resp: Nullable<Response> = await sendRequest(
    url + `/entity/${requestContext.entityTypeName}/${entityName}`,
    'GET',
  );

  if (resp == null) {
    showError('Network Error', `No data for the entity ${entityName} could be fetched.`);
    return null;
  }

  if (resp.status == 200) return resp.json();
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
  } else if (authFailed(resp.status)) {
    // TODO

    return null;
  }

  const message = (await resp.json()).message;
  showError('Cannot fetch schema', `Server responded with "${message}"`);
  return null;
}
