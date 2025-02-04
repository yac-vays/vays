/**
 * Controller element for the EntityList in the Overview page.
 */

import { getEntityList } from '../../../model/entityList';
import { EntityObject } from '../../../utils/types/api';
import { Nullable } from '../../../utils/types/typeUtils';
import { RequestContext } from '../../../utils/types/internal/request';
import entityListCtrlState from '../../state/EntityListCtrlState';
import { getActions } from './action';
import { QueryResponse, QueryResult } from '../../../utils/types/internal/entityList';
import { performSearch } from './search';

/**
 * Fetches a list of entities based on the provided request context, pagination parameters, and optional search criteria.
 *
 * @param requestContext - The context of the request, including the entity type and other relevant information.
 * @param maxNumOfResults - The maximum number of results to return.
 * @param offset - The starting index for the results to return.
 * @param searchList - An optional list of search terms to filter the entities.
 * @returns A promise that resolves to a QueryResponse containing the entity name, partial results, and the total number of results.
 *
 * @remarks
 * - If the accessed entity type or its options are undefined, the function returns an empty result set.
 * - The results are paginated based on the provided offset and maximum number of results.
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

  let entities: EntityObject[] = await getEntityList(requestContext);

  // Perform search
  // TODO: Make this more performant.
  if (searchList != null) {
    entities = performSearch(requestContext, entities, searchList);
  }

  let entityList: QueryResult[] = [];
  const numResults = Math.min(offset + maxNumOfResults, entities.length);
  for (let i = offset; i < numResults; i++) {
    const entity = entities[i];
    const values = representEntity(entity, requestContext);

    entityList.push({
      isLink: entity.link,
      elt: values,
      actionPair: getActions(requestContext, entity),
      entityName: entity.name,
    });
  }
  return {
    entityName: requestContext.entityTypeName,
    partialResults: entityList,
    totalNumberOfResults: entities.length,
  };
}

/**
 * Represents an entity by extracting and formatting its relevant information.
 *
 * @param entity - The entity object containing the data to be represented.
 * @param requestContext - The context of the request, including accessed entity type and options.
 * @returns An array of strings representing the entity's formatted values.
 *
 * @remarks
 * - The function iterates over the options of the accessed entity type from the request context.
 * - If the value is found in the option's aliases, the alias is used.
 * - If the value is null, it adds '(None)' to the values array.
 * - The function ensures that commas in the values are properly spaced.
 * - Additional values such as 'Logs' and 'Actions' are added to the end
 *
 */
function representEntity(entity: EntityObject, requestContext: RequestContext): string[] {
  let values = [entity.name];
  for (const option of requestContext.accessedEntityType?.options!) {
    // TODO: This is ugly, do better typing!
    const value: string = (entity.options as any)[(option as any).name] as string;
    if (value in (option as any).aliases) {
      values.push((option as any).aliases[value]);
    } else if (value == null) {
      // TODO: Make this italics, rather than normal text.
      // Can maybe leave this code and just filter for this flag.
      values.push('(None)');
    } else {
      values.push(value.toString().replaceAll(',', ', '));
    }
  }
  values.push('Logs');
  values.push('Actions');

  return values;
}

/**
 * Generates an array of header entries based on the provided request context.
 *
 * @param requestContext - The context of the request containing the accessed entity type and its options.
 * @returns An array of strings representing the header entries.
 * If the accessed entity type or its options are undefined or null, an empty array is returned.
 *
 * The header entries include:
 * - 'Name': A default entry.
 * - Titles of the options from the accessed entity type.
 * - 'Logs': A placeholder for logs (needs further validation).
 * - 'Actions': A default entry for actions.
 */
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
  setTableEntries: (v: QueryResult[]) => void;
  setCurrPage: (v: number) => void;
  setLoading: (v: boolean) => void;
  setNumColumns: (v: number) => void;
}

/**
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
