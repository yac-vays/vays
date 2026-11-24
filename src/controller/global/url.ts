import { getEntityTypes } from '../../model/entityType';
import { userIsLoggedIn } from '../../session/login/tokenHandling';
import { isNameGeneratedByYAC } from '../../utils/nameUtils';
import { EntityTypeDecl } from '../../utils/types/api';
import { YACBackend } from '../../utils/types/config';
import {
  EditViewMode,
  RequestContext,
  RequestEditContext,
  RequestOverviewContext,
} from '../../utils/types/internal/request';
import { Nullable } from '../../utils/types/typeUtils';

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
  return { rc: getDefaultRequestContext() };
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
  };
}

/** The request context of an entity type of the named backend (unverified names). */
async function resolveRequestContext(
  backendName: string,
  entityTypeName: string,
  backends: YACBackend[],
): Promise<RequestContext> {
  const be = backends.find((backend) => backend.name === backendName) ?? null;
  const entityTypeList: EntityTypeDecl[] = await getEntityTypes(be);
  return {
    yacURL: be?.url ?? null,
    entityTypeName: entityTypeName,
    accessedEntityType: findEntityType(entityTypeName, entityTypeList),
    backendObject: be,
    entityTypeList: entityTypeList,
  };
}

export async function getRequestContextOverview(
  backendName: string,
  entityTypeName: string,
  backends: YACBackend[],
): Promise<RequestOverviewContext> {
  return { rc: await resolveRequestContext(backendName, entityTypeName, backends) };
}

export async function getRequestContextEdit(
  backendName: string,
  entityTypeName: string,
  backends: YACBackend[],
  mode: EditViewMode,
  entityName: string | undefined,
): Promise<RequestEditContext> {
  const rc = await resolveRequestContext(backendName, entityTypeName, backends);
  if (mode === 'create' && isNameGeneratedByYAC(rc.accessedEntityType)) entityName = undefined;
  return { entityName, mode, rc };
}

/** The declaration of the entity type with the given name, if there is one. */
export function findEntityType(
  typeName: Nullable<string>,
  entityTypeList: EntityTypeDecl[],
): Nullable<EntityTypeDecl> {
  if (typeName == null) return null;
  return entityTypeList.find((et) => et.name === typeName) ?? null;
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

  const be = backends.find((backend) => backend.name === backendName);
  if (be == undefined) return false;

  return findEntityType(entityTypeName, await getEntityTypes(be)) != null;
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

  if (!['create', 'edit', 'read'].includes(mode)) {
    return false;
  }

  if (mode !== 'create' && entityName == undefined) return false;

  return await isValidQueryOverview(backendName, entityTypeName, backends);
}

/**
 * @param backends The list of backends in the frontend config.
 * @returns
 */
export async function getDefaultURL(backends: YACBackend[]): Promise<string> {
  if (backends.length == 0 || !userIsLoggedIn()) {
    return '/';
  }
  for (let i = 0; i < backends.length; i++) {
    const backendName = backends[i].name;
    const etd: EntityTypeDecl[] = await getEntityTypes(backends[i]);
    if (etd.length == 0) {
      continue;
    }
    return `/${backendName}/${etd[0].name}/`;
  }
  return '/';
}

type NavigationHook = (link: string, options?: { replace?: boolean }) => void;

let navHook: Nullable<NavigationHook> = null;

/**
 * The hook needs to be registered since a hook cannot be used outside a react element.
 * @param nav
 */
export function registerNavigationHook(nav: NavigationHook) {
  navHook = nav;
}

/** @param replace Replace the current history entry instead of adding one. */
export function navigateToURL(link: string, replace: boolean = false) {
  if (navHook == null) return;
  if (replace) navHook(link, { replace: true });
  else navHook(link);
}

/** Whether the URL path (possibly percent-encoded) starts with `prefix` (unencoded). */
export function pathStartsWith(pathname: string, prefix: string): boolean {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // malformed escape: compare as is
  }
  return decoded.startsWith(prefix);
}

/**
 * Whether a navigation leaves the document open in the edit view. While
 * creating, the URL follows the typed name below `createBase`; otherwise any
 * other path is another document.
 */
export function leavesEditedDocument(
  mode: EditViewMode,
  createBase: string,
  currentPath: string,
  nextPath: string,
): boolean {
  if (mode === 'create') return !pathStartsWith(nextPath, createBase);
  return nextPath !== currentPath;
}

/**
 *
 * @param yacBackend The currently selected YAC Backend
 * @param entityTypeName The corresponding entity type name.
 * @param entityName Optional name to prefill the create form with.
 * @returns Valid URL creating an entity of given type, on given backend.
 */
export function buildCreateURL(
  yacBackend: YACBackend,
  entityTypeName: string,
  entityName?: string,
) {
  const base = `/${yacBackend.name}/${entityTypeName}/create/`;
  return entityName ? `${base}${encodeURIComponent(entityName)}` : base;
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

/**
 * Builds the URL of an entity-scoped action page (edit / read).
 *
 * @param backendName The YAC backend name.
 * @param entityTypeName The corresponding entity type name.
 * @param verb The route verb: `edit` or `read` (read-only).
 * @param entityName The entity the action applies to.
 */
export function buildEntityActionURL(
  backendName: string | undefined,
  entityTypeName: string | null | undefined,
  verb: 'edit' | 'read',
  entityName: string,
) {
  return `/${backendName}/${entityTypeName}/${verb}/${encodeURIComponent(entityName)}`;
}

/**
 * Builds the overview URL that highlights (and scrolls to) a specific entity.
 * The entity name travels as the `name` query parameter.
 *
 * @param backendName The YAC backend name.
 * @param entityTypeName The corresponding entity type name.
 * @param entityName The entity to highlight; omit for the plain overview.
 */
export function buildOverviewHighlightURL(
  backendName: string | undefined,
  entityTypeName: string | null | undefined,
  entityName?: string | null,
) {
  const base = `/${backendName}/${entityTypeName}`;
  return entityName ? `${base}?name=${encodeURIComponent(entityName)}` : base;
}

/**
 * Keep the URL of the create view on the typed name, without a history entry
 * per keystroke. Does nothing outside create mode.
 */
export function editViewNavigateToNewName(
  name: Nullable<string>,
  requestEditContext: RequestEditContext,
) {
  if (requestEditContext.mode !== 'create') return;
  const base = `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/create`;
  // Not when the user just navigated away.
  if (!pathStartsWith(window.location.pathname, base)) return;
  navigateToURL(`${base}/${name == null ? '' : encodeURIComponent(name)}`, true);
}
