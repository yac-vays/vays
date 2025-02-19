import {
  checkPermissions,
  getActionCallback,
  OPERATION_VIEW,
  OPERATIONS,
  OPERATIONS_META,
} from '../../../model/action';
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
  yacURL: string | null | undefined,
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
      } else {
        _addFavoriteOperation(action.name, favActs, entity, requestContext);
      }
    }
  }
  return favActs;
}

/**
 * Adds a favorite operation. For the edit (change) operation, if it is not allowed,
 * then it will be exchanged for the view operation.
 * @param opName
 * @param favActs
 */
function _addFavoriteOperation(
  opName: string,
  favActs: GUIActionButtonArg[],
  entity: EntityObject,
  requestContext: RequestContext,
) {
  const entityName: string = entity.name;
  let entry: ActionDecl = OPERATIONS[opName] as ActionDecl;
  let isAllowed = checkPermissions(entity.perms, entry.perms);
  if (entry.name === 'change' && !isAllowed) {
    entry = OPERATION_VIEW;
    isAllowed = true;
    opName = entry.name;
  }

  favActs.push({
    action: entry,
    isAllowed: isAllowed,
    performAction: OPERATIONS_META[opName].getOperationCallback(entityName, requestContext),
  });
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

function __alertBadAction(name: string, yacURL: string | null | undefined) {
  console.log(`ERROR: ${name} is not defined in the Entity Type Definition.
    This is a configuration errror on the side of the YAC backend.
    Please contact the maintainer of the corresponding backend, 
    ${yacURL} in this case. Thank you very much and sorry
    for any inconveniences caused by this.`);
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

    let operation: ActionDecl = OPERATIONS[opName];
    const isAllowed = checkPermissions(entity.perms, operation.perms);
    if (!isAllowed && operation.name === 'change') {
      operation = OPERATION_VIEW;
    } else if (!isAllowed) {
      continue;
    }

    result.push({
      action: operation,
      performAction: OPERATIONS_META[opName].getOperationCallback(entity.name, requestContext),
    });
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
