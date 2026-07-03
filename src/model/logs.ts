import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle } from '../utils/toastUtils';
import { EntityLog, TYPE_CHECK_ENTITY_LOG } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import VAYS_CACHE from './caching';
import { LOGS_CACHE_KEY } from './caching/cachekeys';
import { invalidateEntityListCache } from './entityList';
import { handleYacResponse, yacErrorDetail } from './utils/handleYacResponse';

function getLogID(
  url: string | null | undefined,
  entityTypeName: string | null,
  entityName: string,
) {
  if (url == null || url == undefined) return url + `/entity/${entityTypeName}/${entityName}/logs`;
  return joinUrl(url, `/entity/${entityTypeName}/${entityName}/logs`);
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

  if (url == null || url == undefined) return null;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}/logs`),
    'GET',
    null,
    LOGS_CACHE_KEY,
  );

  if (resp == null) {
    showError(
      entityToastTitle(requestContext, entityName),
      `Fetching logs for ${entityName} failed: the backend could not be reached.`,
    );
    return null;
  }

  if (resp.status == 404) {
    // The entity is gone — refresh the list so it disappears.
    invalidateEntityListCache(url, requestContext.entityTypeName);
    return null;
  }

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestContext, entityName),
    errorText: `Fetching logs for ${entityName} failed`,
    errorMessage: 'Please contact the admin to resolve this issue.',
  });

  if (result.kind === 'success') {
    return typeCheckLog(await result.resp.json(), entityName);
  } else if (result.kind === 'invalid-request') {
    // No validation error should happen here.
    showError('Internal Error', 'Error ID-VAL-GEL-01. Please file a bug report!');
  } else if (result.kind === 'client-error') {
    showError(
      entityToastTitle(requestContext, entityName),
      yacErrorDetail(
        `Fetching logs for ${entityName} failed`,
        result.status,
        result.body,
        'Please try again.',
      ),
    );
  }
  return null;
}

function typeCheckLog(logs: unknown, entityName: string): Nullable<EntityLog[]> {
  if (typeCheck(`[${TYPE_CHECK_ENTITY_LOG}]`, logs)) {
    return logs as EntityLog[];
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching logs from ${entityName}.`,
  );

  return null;
}
