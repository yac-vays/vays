 
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
 * - Additional values such as 'Status' (logs) and 'Actions' are added to the end
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
    values.push({ value: 'Status', isMarkdown: false });
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
 * - 'Status': A placeholder for the log indicators (needs further validation).
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
    header.push('Status');
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
 * Stamp of the latest table-content dispatch across ALL fetch paths: the
 * effect loader (useInitializeList), explicit reloads ({@link reload}, page
 * flips / refresh button) and the column search (getSearchCallback). One
 * SHARED counter, because all three write the same table state — a response
 * that is newest within its own path can still be older than what another
 * path already applied (e.g. a slow page-3 reload landing after a newer
 * search already filtered the table). Mirrors the validationSeq pattern of
 * the edit controller.
 */
let listGeneration = 0;

/** Stamp a new table-content dispatch; keep the id for {@link isStaleListGeneration}. */
export function nextListGeneration(): number {
  return ++listGeneration;
}

/** True if a newer table-content dispatch happened since `gen` (drop the response). */
export function isStaleListGeneration(gen: number): boolean {
  return gen !== listGeneration;
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

    const seq = nextListGeneration();
    setLoading(true);
    const header: string[] = getHeaderEntries(requestContext);
    setTableHeaderEntries(header);

    const qRes: QueryResponse = await fetchEntities(
      requestContext,
      numResultsPerPage.valueOf(),
      (pageNumber - 1) * numResultsPerPage,
      searchList,
    );

    // A newer table-content dispatch (reload, search, or the effect loader)
    // happened in the meantime — let it win.
    if (isStaleListGeneration(seq)) return;

    setLoading(false);
    setTableEntries(qRes.partialResults);
  }
}
