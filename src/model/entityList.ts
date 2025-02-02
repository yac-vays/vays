import { logError } from '../utils/logger';
import { authFailed, sendRequest } from '../utils/AuthedRequest';
import { Nullable } from '../utils/types/typeUtils';
import { showError } from '../controller/local/ErrorNotifyController';
import VAYS_CACHE from './caching';
import { RequestContext } from '../utils/types/internal/request';
import { EntityObject } from '../utils/types/api';

export const ENTITY_LIST_CACHE_KEY: string = 'EntityList';

export function invalidateEntityListCache(
  yacURL: string | null | undefined,
  entityTypeName: string | null,
) {
  if (!yacURL || !entityTypeName) return;
  const cacheKey: string = yacURL + `/entity/${entityTypeName}`;
  VAYS_CACHE.invalidate(ENTITY_LIST_CACHE_KEY, cacheKey);
}

export function registerEntityListInvalidationHook(
  yacURL: string | null | undefined,
  entityTypeName: string | null,
  hook: () => void,
) {
  if (!yacURL || !entityTypeName) return;
  const cacheKey: string = yacURL + `/entity/${entityTypeName}`;
  VAYS_CACHE.registerInvHook(ENTITY_LIST_CACHE_KEY, cacheKey, hook);
}

export async function getEntityList(requestContext: RequestContext): Promise<EntityObject[]> {
  if (requestContext.backendObject?.url === undefined) {
    logError(
      `Backend Name ${requestContext.backendObject?.url} was undefined...`,
      'getEntityTypes',
    );
    return [];
  }

  const url = requestContext.backendObject?.url;

  const resp: Nullable<Response> = await sendRequest(
    url + `/entity/${requestContext.entityTypeName}`,
    'GET',
    null,
    ENTITY_LIST_CACHE_KEY,
  );

  if (resp == null) {
    return [];
  } else if (resp.status == 200) {
    const res = await resp.json();
    // TODO: Do not ignore the hash here
    return res.list as EntityObject[];
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject.title}: ` +
        (ans.title ??
          `Could not fetch ${requestContext.entityTypeName} list (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return [];
  } else if (authFailed(resp.status)) {
    // TODO
  }

  return [];
}
