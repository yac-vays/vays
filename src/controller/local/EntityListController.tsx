/**
 * Controller element for the EntityList in the Overview page.
 */

import {
  checkPermissions,
  getActionCallback,
  OPERATIONS,
  OPERATIONS_META,
  sendAction,
} from '../../model/ActionCaller';
import {
  ActionDecl,
  EntityObject,
  FavOpObject,
  getEntityList,
} from '../../model/EntityListFetcher';
import { Nullable } from '../../utils/typeUtils';
import { RequestContext } from '../global/URLValidation';
import entityListCtrlState from '../state/EntityListCtrlState';

export interface QueryResponse {
  entityName: string | null;
  partialResults: string[][];
  totalNumberOfResults: number;
}

/**
 * Assumes that requestContext.accessedEntityType?.options is not undefined
 * TODO: Fix search for boolean values.
 * @param requestContext
 * @param entities
 * @param searchList
 * @returns
 */
function _performSearch(
  requestContext: RequestContext,
  entities: EntityObject[],
  searchQueries: (string | null)[],
) {
  let filteredEntities: EntityObject[] = [];
  const searchList = searchQueries.map((v) => v?.toLowerCase());
  for (const entity of entities) {
    let i: number = 1;
    let passed = true;
    const hasNameSearch = searchList[0] != null && searchList[0] != '';
    if (hasNameSearch) {
      if (!entity.name.includes(searchList[0] as string)) {
        continue;
      }
    }
    for (const option of requestContext.accessedEntityType?.options as object[]) {
      // TODO: This is ugly, do better typing!
      const value: string = (
        (entity.options as any)[(option as any).name]?.toString() ?? ''
      ).toLowerCase();
      if (value in (option as any).aliases) {
        const actualValue: string = (option as any).aliases[value].toLowerCase();
        // if (searchList[i] != null)
        // console.log(searchList[i]);
        // TODO check the type warning on the searchList again..
        if (searchList[i] != null && !actualValue.includes(searchList[i] as string)) {
          passed = false;
          break;
        }
      } else if (
        searchList[i] != null &&
        value != undefined &&
        !value.includes(searchList[i] as string)
      ) {
        passed = false;
        break;
      } else if (searchList[i] != null && searchList[i] != '' && (value === '' || value == null)) {
        passed = false;
        break;
      }
      i++;
    }
    if (passed) filteredEntities.push(entity);
  }
  return filteredEntities;
}

/**
 * Currently does not allocate more stuff.
 * @param requestContext
 * @param numOfResults
 * @param searchDict TODO: Currently unused.
 * @returns
 *
 * Allowed search parameters so far is ONLY THE OPTIONS.
 */
export async function fetchEntities(
  requestContext: RequestContext,
  maxNumOfResults: number,
  offset: number,
  searchList: Nullable<(string | null)[]> = null,
): Promise<QueryResponse> {
  if (
    requestContext.accessedEntityType == undefined ||
    requestContext.accessedEntityType.options == null
  ) {
    return {
      entityName: requestContext.entityTypeName,
      partialResults: [],
      totalNumberOfResults: 0,
    };
  }

  // TODO: Need to set the right parameters
  let entities: EntityObject[] = await getEntityList(requestContext);

  // Perform search
  // TODO: Make this more performant.
  if (searchList != null) {
    entities = _performSearch(requestContext, entities, searchList);
  }

  let entityList: string[][] = [];
  const numResults = Math.min(offset + maxNumOfResults, entities.length);
  for (let i = offset; i < numResults; i++) {
    const entity = entities[i];
    let values = [entity.name];
    // TODO: Required like this to ensure consistent ordering?
    // Probably not, since expert mode! The order may have been permuted.
    for (const option of requestContext.accessedEntityType?.options) {
      // TODO: This is ugly, do better typing!
      const value: string = (entity.options as any)[(option as any).name] as string;
      if (value in (option as any).aliases) {
        values.push((option as any).aliases[value]);
      } else if (value == null) {
        // TODO: Make this italics, rather than normal text.
        // Can maybe leave this code and just filter for this flag.
        values.push('(None)');
      } else {
        values.push(value.toString().replaceAll(',', ', ')); //value.toString()
      }
    }
    values.push('Not available');
    // TODO: Fix typing!!!
    values.push({
      actionPair: getActions(requestContext, entity),
      host: entity.name,
    } as unknown as string);
    entityList.push(values);
  }
  // TODO: Do better typing for the value list. It is not just all strings!
  return {
    entityName: requestContext.entityTypeName,
    partialResults: entityList,
    totalNumberOfResults: entities.length,
  };
}

export function getHeaderEntries(requestContext: RequestContext): string[] {
  if (
    requestContext.accessedEntityType == undefined ||
    requestContext.accessedEntityType.options == null
  ) {
    return [];
  }

  let header: string[] = ['Name'];
  for (const option of requestContext.accessedEntityType?.options) {
    const optName: string = (option as any).title as string;
    header.push(optName);
  }
  header.push('Logs'); // TODO: Need to check whether logs is empty in entity type def
  header.push('Actions');
  return header;
}

export interface EntityListVariableHandlers {
  setTableHeaderEntries: (v: string[]) => void;
  setTableEntries: (v: string[][]) => void;
  setCurrPage: (v: number) => void;
  setLoading: (v: boolean) => void;
  setNumColumns: (v: number) => void;
}

/**
 * TODO: Enable search queries.
 * @param requestContext
 * @param param1
 * @param numResultsPerPage
 * @param resetPage
 * @param pageNumber
 * @param resetTableBeforeLoading
 */
export async function reload(
  requestContext: RequestContext,
  {
    setTableHeaderEntries,
    setTableEntries,
    setCurrPage,
    setLoading,
    setNumColumns,
  }: EntityListVariableHandlers,

  numResultsPerPage: number,
  resetPage: boolean,
  pageNumber: number,
  searchList: Nullable<(string | null)[]>,
  resetTableBeforeLoading: boolean = false,
) {
  if (requestContext.accessedEntityType?.options == undefined) {
    setTableHeaderEntries([]);
  } else {
    if (resetTableBeforeLoading) setTableEntries([]);
    if (resetPage) {
      setCurrPage(1);
      pageNumber = 1;
    }

    setLoading(true);
    const header: string[] = await getHeaderEntries(requestContext);
    setNumColumns(header.length);
    setTableHeaderEntries(header);

    const qRes: QueryResponse = await fetchEntities(
      requestContext,
      numResultsPerPage.valueOf(),
      (pageNumber - 1) * numResultsPerPage,
      searchList,
    );

    setLoading(false);
    setTableEntries(qRes.partialResults);
  }
}

export interface GUIActionButtonArg {
  action: ActionDecl;
  isAllowed: boolean;
  /**
   *
   * @param requestContext
   * @param entityName
   * @param actionName
   * @returns A boolean, indicating, whether the action worked.
   */
  performAction: () => Promise<boolean>;
}

export interface GUIActionDropdownArg {
  action: ActionDecl;
  performAction: () => Promise<boolean>;
}

export interface ActionsColumnResults {
  favActs: GUIActionButtonArg[];
  dropdownActs: GUIActionDropdownArg[];
}

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
 * TODO: Make this more efficient (find more efficient algorithm)
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

export function registerTableScrollContainer(cb: any) {
  entityListCtrlState.scrollContainer = cb;
}

export function positionDropdownElement(
  dropDownElt: React.RefObject<HTMLDivElement>,
  dropdownHeaderElt: React.RefObject<HTMLDivElement>,
) {
  if (dropdownHeaderElt.current == null || dropDownElt.current == null) {
    return;
  }
  const rect = dropdownHeaderElt.current?.getBoundingClientRect();
  let delta = 0; // default
  if (window.outerWidth >= 1024) {
    // md
    delta = -290;
  }

  dropDownElt.current.style.left = `${rect.x + delta}px`; // Align it to the left}
}

export function registerTableScrollContainerEvent(callback: () => void) {
  entityListCtrlState.scrollContainer?.current?.addEventListener('scroll', callback);
}
