import VAYS_CACHE from '../caching/AppCache';
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

const LOGS_CACHE_KEY = 'EntityLogs';

export function isLogCached(entityName: string, requestContext: RequestContext) {
  const url: string | null | undefined = requestContext.yacURL;
  return VAYS_CACHE.isCached(
    LOGS_CACHE_KEY,
    url + `/entity/${requestContext.entityTypeName}/${entityName}/logs`,
  );
}

export async function getEntityLogs(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityLog[] | null> {
  const url: string | null | undefined = requestContext.yacURL;

  const resp: Nullable<Response> = await sendRequest(
    url + `/entity/${requestContext.entityTypeName}/${entityName}/logs`,
    'GET',
    null,
    LOGS_CACHE_KEY,
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
