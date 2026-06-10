/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Controller element for the EntityList in the Overview page.
 */

import { getEntityList } from '../../../model/entityList';
import { EntityObject } from '../../../utils/types/api';
import {
  OverviewListCellEntry,
  QueryResponse,
  QueryResult,
} from '../../../utils/types/internal/entityList';
import { hasLogsDefined } from '../../../utils/logUtils';
import { RequestContext } from '../../../utils/types/internal/request';
import { Nullable } from '../../../utils/types/typeUtils';
import entityListCtrlState from '../../state/EntityListCtrlState';
import { getActions } from './action';
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

  const entityList: QueryResult[] = [];
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
 * Determines the (1-based) page on which a given entity appears, respecting the
 * current search filter and page size. Returns null if the entity is not part
 * of the (filtered) list, so the caller can keep its current page.
 *
 * @param requestContext - The context of the request.
 * @param entityName - The name of the entity to locate.
 * @param numResultsPerPage - The page size currently in use.
 * @param searchList - The active search filter (if any).
 */
export async function getEntityPage(
  requestContext: RequestContext,
  entityName: string,
  numResultsPerPage: number,
  searchList: Nullable<(string | null)[]> = null,
): Promise<Nullable<number>> {
  if (
    requestContext.accessedEntityType == undefined ||
    requestContext.accessedEntityType.options == null
  ) {
    return null;
  }
  let entities: EntityObject[] = await getEntityList(requestContext);
  if (searchList != null) {
    entities = performSearch(requestContext, entities, searchList);
  }
  const index = entities.findIndex((e) => e.name === entityName);
  if (index < 0) return null;
  return Math.floor(index / numResultsPerPage) + 1;
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
function representEntity(
  entity: EntityObject,
  requestContext: RequestContext,
): OverviewListCellEntry[] {
  const values = [{ value: entity.name, isMarkdown: false }];
  for (const option of requestContext.accessedEntityType?.options ?? []) {
    const rawValue = entity.options[option.name];
    const value = rawValue == null ? null : String(rawValue);
    if (value != null && value in option.aliases) {
      values.push({ value: option.aliases[value], isMarkdown: true });
    } else if (value == null) {
      values.push({ value: '(None)', isMarkdown: false });
    } else {
      values.push({ value: value.replaceAll(',', ', '), isMarkdown: false });
    }
  }
  if (hasLogsDefined(requestContext)) {
    values.push({ value: 'Logs', isMarkdown: false });
  }
  values.push({ value: 'Actions', isMarkdown: false });

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

  const header: string[] = ['Name'];
  for (const option of requestContext.accessedEntityType?.options ?? []) {
    const optName: string = option.title as string;
    header.push(optName);
  }
  if (hasLogsDefined(requestContext)) {
    header.push('Logs');
  }
  header.push('Actions');
  return header;
}

export interface EntityListVariableHandlers {
  setTableHeaderEntries: (v: string[]) => void;
  setTableEntries: (v: QueryResult[]) => void;
  setCurrPage: (v: number) => void;
  setLoading: (v: boolean) => void;
}

/**
 * Stamp of the latest {@link reload} dispatch. Responses carrying an older
 * stamp lost the race against a newer reload (rapid page flips / context
 * switches) and must not overwrite the newer table content. Mirrors the
 * validationSeq pattern of the edit controller.
 */
let reloadSeq = 0;

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
  { setTableHeaderEntries, setTableEntries, setCurrPage, setLoading }: EntityListVariableHandlers,

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

    const seq = ++reloadSeq;
    setLoading(true);
    const header: string[] = getHeaderEntries(requestContext);
    setTableHeaderEntries(header);

    const qRes: QueryResponse = await fetchEntities(
      requestContext,
      numResultsPerPage.valueOf(),
      (pageNumber - 1) * numResultsPerPage,
      searchList,
    );

    // A newer reload has been dispatched in the meantime — let it win.
    if (seq !== reloadSeq) return;

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
  // The trigger sits at the right edge of the screen, so open the menu leftward:
  // align its right edge with the trigger's right edge.
  //
  // `style.left` is relative to the offset parent, while `rect` is in viewport
  // coordinates, so we subtract the offset parent's left edge to convert.
  const menuWidth = dropDownElt.current.offsetWidth;
  const parentLeft = dropDownElt.current.offsetParent?.getBoundingClientRect().left ?? 0;
  dropDownElt.current.style.left = `${rect.right - menuWidth - parentLeft}px`;
}

export function registerTableScrollContainerEvent(callback: () => void) {
  entityListCtrlState.scrollContainer?.current?.addEventListener('scroll', callback);
}

export function unregisterTableScrollContainerEvent(callback: () => void) {
  entityListCtrlState.scrollContainer?.current?.removeEventListener('scroll', callback);
}
