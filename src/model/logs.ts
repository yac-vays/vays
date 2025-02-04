import VAYS_CACHE from './caching';
import { RequestContext } from '../utils/types/internal/request';
import { showError } from '../controller/local/notification';
import { authFailed, sendRequest } from '../utils/authRequest';
import { Nullable } from '../utils/types/typeUtils';
import { invalidateEntityListCache } from './entityList';
import { EntityLog } from '../utils/types/api';

export const LOGS_CACHE_KEY = 'EntityLogs';
export const LOGS_CACHE_TTL = 30_000;

function getLogID(
  url: string | null | undefined,
  entityTypeName: string | null,
  entityName: string,
) {
  return url + `/entity/${entityTypeName}/${entityName}/logs`;
}

export function isLogCached(entityName: string, requestContext: RequestContext) {
  const url: string | null | undefined = requestContext.yacURL;
  return VAYS_CACHE.isCached(
    LOGS_CACHE_KEY,
    getLogID(url, requestContext.entityTypeName, entityName),
  );
}

export function invalidateLogCache(entityName: string, requestContext: RequestContext) {
  const url: string | null | undefined = requestContext.yacURL;
  VAYS_CACHE.invalidate(LOGS_CACHE_KEY, getLogID(url, requestContext.entityTypeName, entityName));
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
  else if (resp.status == 404) {
    invalidateEntityListCache(url, requestContext.entityTypeName);
    return null;
  } else if (resp.status == 422) {
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
