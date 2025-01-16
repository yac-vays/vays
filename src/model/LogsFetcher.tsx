import { RequestContext } from '../controller/global/URLValidation';
import { showError } from '../controller/local/ErrorNotifyController';
import { authFailed, sendRequest } from '../utils/AuthedRequest';
import { Nullable } from '../utils/typeUtils';

export type EntityLog = {
  name: string;
  message: string;
  time: string;
  progress: Nullable<number>;
  problem: Nullable<boolean>;
};

export async function getEntityLogs(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityLog[] | null> {
  const url: string | null | undefined = requestContext.yacURL;

  const resp: Nullable<Response> = await sendRequest(
    url + `/entity/${requestContext.entityTypeName}/${entityName}/logs`,
    'GET',
  );

  if (resp == null) {
    showError('Network Error', `No logs for the entity ${entityName} could be fetched.`);
    return null;
  }

  if (resp.status == 200) return resp.json();
  else if (resp.status == 422) {
    // No validation error should happen here.
    showError('Internal Error', 'Error ID-VAL-GEL-01. Please file a bug report!');
    return null;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Could not fetch entity logs for ${entityName} (Status ${resp.status})`),
      ans.message ?? 'Could not fetch entity logs. Please contact the admin to resolve this issue.',
    );
    return null;
  } else if (authFailed(resp.status)) {
    // TODO

    return null;
  }

  const message = (await resp.json()).message;
  showError(`Cannot fetch logs (Status)`, `Server responded with "${message}"`);
  return null;
}
