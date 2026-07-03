import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { logError } from '../utils/logger';
import { entityToastTitle } from '../utils/toastUtils';
import { EntityObject, TYPE_CHECK_ENTITY_OBJECT } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import VAYS_CACHE from './caching';
import { ENTITY_LIST_CACHE_KEY } from './caching/cachekeys';
import { handleYacResponse } from './utils/handleYacResponse';

import { typeCheck } from 'type-check';

/** Hard upper bound on the number of entities fetched per list request. */
const ENTITY_LIST_LIMIT = 10000;

function getListURL(yacURL: string, entityTypeName: string) {
  return joinUrl(yacURL, `/entity/${entityTypeName}?limit=${ENTITY_LIST_LIMIT}`);
}

export function invalidateEntityListCache(
  yacURL: string | null | undefined,
  entityTypeName: string | null,
) {
  if (!yacURL || !entityTypeName) return;
  const cacheKey: string = getListURL(yacURL, entityTypeName);
  VAYS_CACHE.invalidate(ENTITY_LIST_CACHE_KEY, cacheKey);
}

export function registerEntityListInvalidationHook(
  yacURL: string | null | undefined,
  entityTypeName: string | null,
  hook: () => void,
) {
  if (!yacURL || !entityTypeName) return;
  const cacheKey: string = getListURL(yacURL, entityTypeName);
  VAYS_CACHE.registerInvHook(ENTITY_LIST_CACHE_KEY, cacheKey, hook);
}

/**
 * Checks whether the received object has the right typing. Reduces damage of
 * potential bugs induced by backend or malicious data.
 * @param list
 * @returns
 */
function typeCheckEntityList(list: unknown, yacName: string): EntityObject[] {
  if (typeCheck(`[${TYPE_CHECK_ENTITY_OBJECT}]`, list)) {
    return list as EntityObject[];
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching entity list of ${yacName}.`,
  );
  return [];
}

/**
 * Like {@link getEntityList} but also reports whether the fetch actually
 * succeeded. `ok` is false when the request errored (in which case `list` is
 * empty), letting callers tell a genuinely-empty type apart from a failed load
 * — both of which otherwise look like an empty array.
 */
export async function fetchEntityList(
  requestContext: RequestContext,
): Promise<{ ok: boolean; list: EntityObject[] }> {
  if (requestContext.backendObject?.url === undefined || requestContext.entityTypeName == null) {
    logError(
      `Backend Name ${requestContext.backendObject?.url} was undefined...`,
      'getEntityTypes',
    );
    return { ok: false, list: [] };
  }

  const url = requestContext.backendObject?.url;

  const resp: Nullable<Response> = await sendRequest(
    getListURL(url, requestContext.entityTypeName),
    'GET',
    null,
    ENTITY_LIST_CACHE_KEY,
  );

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestContext),
    errorText: 'Fetching the list failed',
    errorMessage: 'Waking up the admin, please stand by...',
  });

  if (result.kind !== 'success') return { ok: false, list: [] };

  const res = await result.resp.json();
  // TODO: Do not ignore the hash here
  const list = typeCheckEntityList(res.list, requestContext.backendObject.title);
  if (list.length >= ENTITY_LIST_LIMIT) {
    // The backend truncates at the requested limit, so the list is most likely
    // incomplete — tell the user instead of silently dropping the rest.
    showError(
      entityToastTitle(requestContext),
      `The list was truncated: only the first ${ENTITY_LIST_LIMIT} entries are shown.`,
    );
  }
  return { ok: true, list };
}

export async function getEntityList(requestContext: RequestContext): Promise<EntityObject[]> {
  return (await fetchEntityList(requestContext)).list;
}
