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

/**
 * A request to refetch logs, delivered to every mounted log field (see
 * {@link subscribeLogRefresh}).
 */
export interface LogRefreshRequest {
  /**
   * The log ID (see `getLogID`) of the one entity to refresh, or null for
   * every entity currently shown.
   */
  logID: string | null;
  /**
   * The moment (epoch ms) of the event that motivated the refresh. A log field
   * whose last fetch started after this moment has already picked up the
   * change and skips the refetch (so e.g. the refresh button's immediate
   * reload and the list-invalidation hook's delayed one don't fetch twice).
   */
  since: number;
}

/**
 * How long after a write or action VAYS waits before refetching the affected
 * logs: YAC answers as soon as the operation is done, but the hooks producing
 * the log entries may still be finishing.
 */
export const LOG_REFRESH_DELAY_MS = 1000;

type LogRefreshListener = (request: LogRefreshRequest) => void;
const logRefreshListeners = new Set<LogRefreshListener>();

/**
 * Subscribe to log refresh requests. Returns the unsubscribe function.
 */
export function subscribeLogRefresh(listener: LogRefreshListener): () => void {
  logRefreshListeners.add(listener);
  return () => {
    logRefreshListeners.delete(listener);
  };
}

function notifyLogRefresh(logID: string | null, since: number) {
  for (const listener of [...logRefreshListeners]) {
    listener({ logID, since });
  }
}

/**
 * Drop the cached logs of one entity and make its (mounted) log field refetch
 * them right away instead of at the next poll tick.
 *
 * @param delayMs Wait this long before refreshing: after an action or write,
 * the hooks that produce the log entries may still be running when YAC
 * answers, so give them a moment.
 * @param since See {@link LogRefreshRequest.since}. Defaults to the moment the
 * refresh fires, i.e. the refetch is never skipped.
 */
export function refreshEntityLogs(
  entityName: string,
  requestContext: RequestContext,
  delayMs: number = 0,
  since?: number,
) {
  const logID = getLogID(requestContext.yacURL, requestContext.entityTypeName, entityName);
  const fire = () => {
    invalidateLogCache(entityName, requestContext);
    notifyLogRefresh(logID, since ?? Date.now());
  };
  if (delayMs > 0) setTimeout(fire, delayMs);
  else fire();
}

/**
 * Like {@link refreshEntityLogs}, but for every entity whose log field is
 * currently mounted (i.e. the whole visible table). Each field invalidates
 * its own cache entry when it receives the request.
 */
export function refreshAllLogs(delayMs: number = 0, since?: number) {
  const fire = () => notifyLogRefresh(null, since ?? Date.now());
  if (delayMs > 0) setTimeout(fire, delayMs);
  else fire();
}

/** The refresh-request ID of an entity's logs (see {@link LogRefreshRequest.logID}). */
export function getEntityLogID(entityName: string, requestContext: RequestContext): string {
  return getLogID(requestContext.yacURL, requestContext.entityTypeName, entityName);
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
    showError('Internal Error', 'Error ID-VAL-GEL-01. Please file a bug report.');
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
