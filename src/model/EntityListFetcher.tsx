/**
 * Fetch information from the YAC backend. May or may not cache some information,
 * the controller should not make any assumptions about this.
 */

import { getYACURL } from './ConfigFetcher';
import { logError } from '../utils/logger';
import { authFailed, sendRequest } from '../utils/AuthedRequest';
import { Nullable } from '../utils/typeUtils';
import { showError } from '../controller/local/ErrorNotifyController';
import { requestFailedNoAuth } from '../session/login/loginProcess';
import VAYS_CACHE from '../caching/AppCache';
import { RequestContext } from '../controller/global/URLValidation';

export const ENTITY_LIST_CACHE_KEY: string = 'EntityList';

export enum NameGeneratedCond {
  never = 'never',
  optional = 'optional',
  enforced = 'enforced',
}

/**
 * Entity Type definition, as it is returned by the YAC backend.
 */
export interface EntityTypeDecl {
  name: string;
  title: string;
  name_pattern: string; // TODO: RegExp
  name_example: string;
  name_generated: NameGeneratedCond;
  example: string;
  description: string;
  create: boolean;
  delete: boolean;
  options: object[]; // TODO: Besseres Typing
  logs: object[];
  actions: ActionDecl[];
  favorites: FavOpObject[];
}

export interface ActionDecl {
  name: string;
  title: string;
  description: string;
  dangerous: boolean;
  icon: string;
  perms: string[];
  force: boolean;
  hooks: string[];
}

export interface FavOpObject {
  name: string;
  action: boolean;
  /*
        create_new does not exist, since it is already privileged.
        */
  // create_new /copy /link, delete, change
}

// TODO: Conversion.
export enum Permission {
  see,
  add,
  rnm,
  cpy,
  lnk,
  edt,
  mod,
  cln,
  del,
  act,
  adm,
}

export const PERMISSION_VALUES: string[] = [
  'see',
  'add',
  'rnm',
  'cpy',
  'lnk',
  'edt',
  'mod',
  'cln',
  'del',
  'act',
  'adm',
];

export interface EntityObject {
  name: string;
  link: Nullable<string>;
  options: object;
  perms: string[];
}

/**
 * TODO: Remove the UID from the configuration.
 * @param backendName The UID of the backend.
 * @returns A list of entity types definitions.
 */
export async function getEntityTypes(
  backendName: string | undefined,
  backendTitle?: string,
): Promise<EntityTypeDecl[]> {
  if (backendName === undefined) {
    logError(`Backend Name ${backendName} was undefined`, 'getEntityTypes');
    return [];
  }

  const url: string | undefined = getYACURL(backendName);

  if (url == undefined) return [];

  const resp: Nullable<Response> = await sendRequest(url + '/entity', 'GET', null, 'EntityType');

  // TODO: Caching should be abstracted into its own class! Then you can decide here
  // what to do on a given status, whether to  remove the cache or update, etc.
  // Cache can then be done in one place, no tin different places...
  // Also what if server down, etc. (Network, ...)
  // VAYS_CACHE.preCacheUnregister('EntityType', url);
  if (resp == null) {
    return [];
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${backendTitle}: ` +
        (ans.title ?? `Could not fetch Entity Types on ${backendName} (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return [];
  } else if (resp.status == 200) {
    const res = await resp.json();
    return res;
  } else if (authFailed(resp.status)) {
    // TODO
    requestFailedNoAuth();
  } else {
    showError(
      `Error ${resp.status}: Can't fetch Entity Types of ${backendName}`,
      `Server returned: ${JSON.stringify(resp.json())}`,
    );
  }

  return [];
}

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
