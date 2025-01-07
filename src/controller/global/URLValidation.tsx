import { EntityTypeDecl, getEntityTypes } from '../../model/EntityListFetcher';
import { YACBackend } from '../../model/ConfigFetcher';
import iSessionStorage from '../../session/storage/SessionStorage';
import { Nullable } from '../../utils/typeUtils';

export type EditViewMode = 'create' | 'modify';

export interface RequestOverviewContext {
  searchQueries?: { [key: string]: string };
  pageNumber: number;
  numPerPage: number;
  rc: RequestContext;
}

export interface RequestEditContext {
  entityName?: string;
  mode: EditViewMode;
  rc: RequestContext;
  viewMode: 'standard' | 'expert';
}

/**
 * Stores the context of the request as per URL.
 */
export interface RequestContext {
  yacURL: string | null | undefined; // TODO: Remove undefined when also redoing the index thing.
  entityTypeName: string | null;
  accessedEntityType: EntityTypeDecl | null;
  // isSearch: boolean; // TODO: Currently not supplied.
  // searchProperty: string | null; // TODO: CURRENTLY NOT SUPPLIED
  // searchQuery: string | null; // TODO: CURRENTLY NOT SUPPLIED
  backendObject: YACBackend | null;
  entityTypeList: EntityTypeDecl[] | null; // The list of entities that this particular backend defines
}

/**
 * Get the default request context, returned when no verifiable contexts is yet available,
 * e.g. before the frontend configuration was returned.
 * @returns
 */
export function getDefaultRequestContext(): RequestContext {
  return {
    yacURL: null,
    entityTypeName: null,
    accessedEntityType: null,
    backendObject: null,
    entityTypeList: null,
  };
}

/**
 * Get the default overview request context.
 * @returns
 */
export function getDefaultRequestOverviewContext(): RequestOverviewContext {
  return {
    searchQueries: {},
    pageNumber: 0,
    numPerPage: 10,
    rc: getDefaultRequestContext(),
  };
}

/**
 * Get the default edit view request context.
 * @returns
 */
export function getDefaultEditContext(): RequestEditContext {
  return {
    entityName: undefined,
    mode: 'create',
    rc: getDefaultRequestContext(),
    viewMode: 'standard',
  };
}

export async function getRequestContextOverview(
  backendName: string,
  entityTypeName: string,
  backends: YACBackend[],
) {
  let be: YACBackend | null = null;
  for (const backend of backends) {
    if (backendName === backend.name) {
      be = backend;
    }
  }
  const entityTypeList: EntityTypeDecl[] = await getEntityTypes(backendName, be?.title);

  return {
    searchQueries: {},
    pageNumber: 0,
    numPerPage: 10,
    rc: {
      yacURL: be?.url,
      entityTypeName: entityTypeName,
      accessedEntityType: getEntityTypeFromEntityName(entityTypeName, entityTypeList),
      // isSearch : false,
      // searchProperty : null, // TODO: Search.
      // searchQuery: null,
      backendObject: be,
      entityTypeList: entityTypeList,
    },
  };
}

export async function getRequestContextEdit(
  backendName: string,
  entityTypeName: string,
  backends: YACBackend[],
  mode: EditViewMode,
  entityName: string | undefined,
  viewMode: string,
): Promise<RequestEditContext> {
  let be: YACBackend | null = null;
  for (const backend of backends) {
    if (backendName === backend.name) {
      be = backend;
    }
  }
  const entityTypeList: EntityTypeDecl[] = await getEntityTypes(backendName, be?.title);

  const sanitizedViewMode =
    viewMode !== 'standard' && viewMode !== 'expert' ? 'standard' : viewMode;
  return {
    entityName: entityName,
    mode: mode,
    rc: {
      yacURL: be?.url,
      entityTypeName: entityTypeName,
      accessedEntityType: getEntityTypeFromEntityName(entityTypeName, entityTypeList),
      backendObject: be,
      entityTypeList: entityTypeList,
    },
    viewMode: sanitizedViewMode,
  };
}

/**
 * Given a list of entity types and a name, it returns the entity declaration object, if available. Otherwhise null.
 * @param entityName
 * @param entityTypeList
 * @returns
 */
export function getEntityTypeFromEntityName(
  entityName: Nullable<string>,
  entityTypeList: EntityTypeDecl[],
): Nullable<EntityTypeDecl> {
  if (entityName == null) return null;

  for (const et of entityTypeList) {
    if (et.name === entityName) {
      return et;
    }
  }
  return null;
}

/**
 * @param yacName The name of the YAC backend, URL friendly.
 * @param entityTypeName The entity type name.
 * @param backends The list of backends, as provided by the frontend configuration.
 */
export async function isValidQueryOverview(
  backendName: string | undefined,
  entityTypeName: string | undefined,
  backends: YACBackend[],
): Promise<boolean> {
  if (backendName == undefined || entityTypeName == undefined) {
    return false;
  }

  // 1. Check if the YAC backend exists.

  let found: boolean = false;
  let be;
  for (const backend of backends) {
    if (backendName === backend.name) {
      found = true;
      be = backend;
      break;
    }
  }

  if (!found) return false;

  // TODO: Maybe postpone this check?
  // 2. Check if the type exists.
  const etd: EntityTypeDecl[] = await getEntityTypes(backendName, be?.title);
  for (const typeDef of etd) {
    if (entityTypeName === typeDef.name) {
      return true;
    }
  }
  return false;
}

export async function isValidQueryEdit(
  backendName: string | undefined,
  entityTypeName: string | undefined,
  entityName: string | undefined,
  backends: YACBackend[],
  mode: EditViewMode,
): Promise<boolean> {
  if (backendName == undefined || entityTypeName == undefined) {
    return false;
  }

  if (mode === 'modify' && entityName == undefined) return false;

  return await isValidQueryOverview(backendName, entityTypeName, backends);
}

/**
 * @param backends The list of backends in the frontend config.
 * @returns
 */
export async function getDefaultURL(backends: YACBackend[]): Promise<string> {
  if (backends.length == 0 || !iSessionStorage.isLoggedIn()) {
    return '/';
    // TODO: Revisit what this case should look like...?
    // Note that this is actually a frontend configuration error
  }
  for (let i = 0; i < backends.length; i++) {
    const backendName = backends[i].name;
    const etd: EntityTypeDecl[] = await getEntityTypes(backendName, backends[i].title);
    if (etd.length == 0) {
      continue;
      // TODO: Again, revisit this case as well. This is a backend configuration
      // error.
    }
    return `/${backendName}/${etd[0].name}/`;
  }
  return '/';
}

let navHook: Nullable<(link: string) => void> = null;

/**
 * The hook needs to be registered since a hook cannot be used outside a react element.
 * @param nav
 */
export function registerNavigationHook(nav: (link: string) => void) {
  navHook = nav;
}

export function navigateToURL(link: string) {
  if (navHook != null) {
    navHook(link);
  }
}

/**
 *
 * @param yacBackend The currently selected YAC Backend
 * @param entityTypeName The corresponding entity type name.
 * @returns Valid URL creating an entity of given type, on given backend.
 */
export function buildCreateURL(yacBackend: YACBackend, entityTypeName: string) {
  return `/${yacBackend.name}/${entityTypeName}/create/`;
}

/**
 *
 * @param yacBackend The currently selected YAC Backend
 * @param entityTypeName The corresponding entity type name.
 * @returns Valid URL viewing all entities of given type, on given backend.
 */
export function buildOverviewURL(yacBackend: YACBackend, entityTypeName: string) {
  return `/${yacBackend.name}/${entityTypeName}`;
}
