import {
  checkPermissions,
  getActionCallback,
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

export function getActions(
  requestContext: RequestContext,
  entity: EntityObject,
): ActionsColumnResults {
  const acts: ActionDecl[] | undefined = requestContext.accessedEntityType?.actions;
  if (acts == undefined || requestContext.accessedEntityType == undefined) {
    return { favActs: [], dropdownActs: [] };
  }

  let actions: { [key: string]: ActionDecl } = {};
  for (let a of acts) {
    actions[a.name] = a;
  }

  let res: ActionsColumnResults = { favActs: [], dropdownActs: [] };
  res.favActs = _getFavActs(
    requestContext.accessedEntityType.favorites,
    actions,
    requestContext.yacURL,
    entity,
    requestContext,
  );
  res.dropdownActs = _getDropdownActs(
    requestContext.accessedEntityType.favorites,
    actions,
    entity,
    requestContext,
  );

  return res;
}
function _getFavActs(
  favorites: FavOpObject[],
  actions: { [key: string]: ActionDecl },
  yacURL: string | null | undefined,
  entity: EntityObject,
  requestContext: RequestContext,
): GUIActionButtonArg[] {
  const entityName: string = entity.name;
  let favActs: GUIActionButtonArg[] = [];
  for (let action of favorites) {
    if (action.action) {
      // okay, this is not an operation, but a usual action
      if (!(action.name in actions)) {
        // This is a configuration error
        console.log(`ERROR: ${action.name} is not defined in the Entity Type Definition.
                    This is a configuration errror on the side of the YAC backend.
                    Please contact the maintainer of the corresponding backend, 
                    ${yacURL} in this case. Thank you very much and sorry
                    for any inconveniences caused by this.`);
      } else {
        const entry: ActionDecl = actions[action.name] as ActionDecl;
        favActs.push({
          action: entry,
          isAllowed: checkPermissions(entity.perms, entry.perms),
          //entity.perms.includes("act", 0),
          performAction: getActionCallback(requestContext, entity.name, entry),
        });
      }
    } else {
      if (!(action.name in OPERATIONS)) {
        // This is a configuration error
        console.log(`ERROR: ${action.name} is not defined in the Entity Type Definition.
                    This is a configuration errror on the side of the YAC backend.
                    Please contact the maintainer of the corresponding backend, 
                    ${yacURL} in this case. Thank you very much and sorry
                    for any inconveniences caused by this.`);
      } else {
        const entry: ActionDecl = OPERATIONS[action.name] as ActionDecl;

        favActs.push({
          action: entry,
          isAllowed: checkPermissions(entity.perms, entry.perms),
          //OPERATIONS_META[action.name].checkPermission(entry.perms),
          performAction: OPERATIONS_META[action.name].getOperationCallback(
            entityName,
            requestContext,
          ),
        });
      }
    }
  }
  return favActs;
}
function __isFav(actionName: string, isAction: boolean, favorites: FavOpObject[]): boolean {
  for (const fav of favorites) {
    if (isAction === fav.action && actionName === fav.name) return true;
  }
  return false;
}
/**
 * @param favorites
 * @param actions
 * @param yacURL
 * @param entity
 * @param requestContext
 */
function _getDropdownActs(
  favorites: FavOpObject[],
  actions: { [key: string]: ActionDecl },
  entity: EntityObject,
  requestContext: RequestContext,
): GUIActionDropdownArg[] {
  let result = [];
  for (const opName in OPERATIONS) {
    if (__isFav(opName, false, favorites)) {
      continue;
    }

    const operation: ActionDecl = OPERATIONS[opName];
    if (!checkPermissions(entity.perms, operation.perms)) continue;

    result.push({
      action: operation,
      performAction: OPERATIONS_META[opName].getOperationCallback(entity.name, requestContext),
    });
  }

  for (const acName in actions) {
    if (__isFav(acName, true, favorites)) continue;

    const actionObj: ActionDecl = actions[acName];
    if (!checkPermissions(entity.perms, actionObj.perms)) continue;

    result.push({
      action: actionObj,
      performAction: getActionCallback(requestContext, entity.name, actionObj),
    });
  }
  return result;
}
