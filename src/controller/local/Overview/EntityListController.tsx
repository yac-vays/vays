/**
 * Controller element for the EntityList in the Overview page.
 */

import { EntityObject, getEntityList } from '../../../model/EntityListFetcher';
import { Nullable } from '../../../utils/typeUtils';
import { RequestContext } from '../../global/URLValidation';
import entityListCtrlState from '../../state/EntityListCtrlState';
import { getActions } from './ActionController';

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
