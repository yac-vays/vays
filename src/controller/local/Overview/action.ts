import {
  checkPermissions,
  getActionCallback,
  OPERATION_READ,
  OPERATIONS,
  OPERATIONS_META,
} from '../../../model/action';
import { logError } from '../../../utils/logger';
import { ActionDecl, EntityObject, FavOpObject } from '../../../utils/types/api';
import {
  ActionsColumnResults,
  GUIActionButtonArg,
  GUIActionDropdownArg,
} from '../../../utils/types/internal/actions';
import { RequestContext } from '../../../utils/types/internal/request';

/**
 * Get the actions for some entitiy.
 * @param requestContext
 * @param entity
 * @returns
 */
export function getActions(
  requestContext: RequestContext,
  entity: EntityObject,
): ActionsColumnResults {
  const acts: ActionDecl[] | undefined = requestContext.accessedEntityType?.actions;
  if (acts == undefined || requestContext.accessedEntityType == undefined) {
    return { favActs: [], dropdownActs: [] };
  }

  const actions: { [key: string]: ActionDecl } = {};
  for (const a of acts) {
    actions[a.name] = a;
  }

  const res: ActionsColumnResults = { favActs: [], dropdownActs: [] };
  res.favActs = getFavActions(
    requestContext.accessedEntityType.favorites,
    actions,
    requestContext.yacURL,
    entity,
    requestContext,
  );
  res.dropdownActs = getDropdownActions(
    requestContext.accessedEntityType.favorites,
    actions,
    entity,
    requestContext,
  );

  return res;
}

/**
 * Whether a built-in operation is enabled at the entity-type level. Copy and
 * link are "create" operations, so they require the type's `create` flag; delete
 * requires the type's `delete` flag. When disabled, the button is removed
 * entirely (as opposed to per-entity permissions, which only disable it).
 */
function isOperationGloballyEnabled(opName: string, requestContext: RequestContext): boolean {
  const type = requestContext.accessedEntityType;
  if (!type) return true;
  if (opName === 'create_copy' || opName === 'create_link') return type.create;
  if (opName === 'delete') return type.delete;
  return true;
}

/** YAC rejects copy, link and edit on an entity that is itself a link. */
function isBlockedOnLink(opName: string): boolean {
  return opName === 'create_copy' || opName === 'create_link' || opName === 'edit';
}

/**
 * Get fav actions.
 * @param favorites
 * @param actions
 * @param yacURL
 * @param entity
 * @param requestContext
 * @returns
 */
function getFavActions(
  favorites: FavOpObject[],
  actions: { [key: string]: ActionDecl },
  yacURL: string | null,
  entity: EntityObject,
  requestContext: RequestContext,
): GUIActionButtonArg[] {
  const favActs: GUIActionButtonArg[] = [];
  for (const action of favorites) {
    if (action.action) {
      // okay, this is not an operation, but a usual action
      if (!(action.name in actions)) {
        // This is a configuration error
        __alertBadAction(action.name, yacURL);
      } else {
        const entry: ActionDecl = actions[action.name] as ActionDecl;
        favActs.push({
          action: entry,
          isAllowed: checkPermissions(entity.perms, entry.perms),
          performAction: getActionCallback(requestContext, entity.name, entry),
        });
      }
    } else {
      if (!(action.name in OPERATIONS)) {
        // This is a configuration error
        __alertBadAction(action.name, yacURL);
      } else if (isOperationGloballyEnabled(action.name, requestContext)) {
        _addFavoriteOperation(action.name, favActs, entity, requestContext);
      }
    }
  }
  return favActs;
}

/**
 * The operation the user actually gets for `opName` on this entity. Edit
 * degrades to Read when it is not available: a read-only type, a missing
 * permission or a link entity (YAC rejects copy/link/edit on links).
 */
function resolveOperation(
  opName: string,
  entity: EntityObject,
  requestContext: RequestContext,
): { decl: ActionDecl; isAllowed: boolean; performAction: () => Promise<boolean>; href?: string } {
  let decl: ActionDecl = OPERATIONS[opName];
  let isAllowed = checkPermissions(entity.perms, decl.perms);
  if (opName === 'edit' && requestContext.accessedEntityType?.edit === false) isAllowed = false;
  if (entity.link != null && isBlockedOnLink(opName)) isAllowed = false;
  if (opName === 'edit' && !isAllowed) {
    decl = OPERATION_READ;
    isAllowed = true;
  }
  const meta = OPERATIONS_META[decl.name];
  const href = meta.getOperationURL?.(entity.name, requestContext);
  return {
    decl,
    isAllowed,
    performAction: meta.getOperationCallback(entity.name, requestContext),
    // Only navigating operations (edit/read) carry an href.
    ...(href ? { href } : {}),
  };
}

/** Adds a favorite operation; one that is not allowed is shown disabled. */
function _addFavoriteOperation(
  opName: string,
  favActs: GUIActionButtonArg[],
  entity: EntityObject,
  requestContext: RequestContext,
) {
  const { decl, ...rest } = resolveOperation(opName, entity, requestContext);
  favActs.push({ action: decl, ...rest });
}

/**
 * Check whether some action is marked as favorite.
 * @param actionName
 * @param isAction
 * @param favorites
 * @returns
 */
function isActionFavorite(
  actionName: string,
  isAction: boolean,
  favorites: FavOpObject[],
): boolean {
  for (const fav of favorites) {
    if (isAction === fav.action && actionName === fav.name) return true;
  }
  return false;
}

function __alertBadAction(name: string, yacURL: string | null) {
  logError(
    `${name} is not defined in the Entity Type Definition.
    This is a configuration errror on the side of the YAC backend.
    Please contact the maintainer of the corresponding backend,
    ${yacURL} in this case.`,
    '__alertBadAction',
  );
}

/**
 * Get the actions which are not marked as favorite.
 * @param favorites
 * @param actions
 * @param entity
 * @param requestContext
 * @returns
 */
function getDropdownActions(
  favorites: FavOpObject[],
  actions: { [key: string]: ActionDecl },
  entity: EntityObject,
  requestContext: RequestContext,
): GUIActionDropdownArg[] {
  const result = [];
  for (const opName in OPERATIONS) {
    // Operation
    if (isActionFavorite(opName, false, favorites)) {
      continue;
    }

    // Remove copy/link/delete entirely when disabled at the entity-type level.
    if (!isOperationGloballyEnabled(opName, requestContext)) {
      continue;
    }

    // Operations that are not allowed are left out of the dropdown.
    const { decl, isAllowed, ...rest } = resolveOperation(opName, entity, requestContext);
    if (!isAllowed) continue;
    result.push({ action: decl, ...rest });
  }

  for (const acName in actions) {
    if (isActionFavorite(acName, true, favorites)) continue;

    const actionObj: ActionDecl = actions[acName];
    if (!checkPermissions(entity.perms, actionObj.perms)) continue;

    result.push({
      action: actionObj,
      performAction: getActionCallback(requestContext, entity.name, actionObj),
    });
  }
  return result;
}
