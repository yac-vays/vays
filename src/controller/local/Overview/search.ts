import { resolveAlias } from '../../../utils/columnUtils';
import { EntityObject } from '../../../utils/types/api';
import { RequestContext } from '../../../utils/types/internal/request';

/**
 * Performs a search on a list of entities based on the provided search queries.
 * Matching is case-insensitive.
 *
 * @param requestContext - The context of the request, containing accessed entity type options.
 * @param entities - The list of entities to search through.
 * @param searchQueries - An array of search query strings, where each string corresponds to a search criterion.
 * @returns An array of entities that match the search criteria.
 *
 * @note Assumes that requestContext.accessedEntityType?.options is not undefined
 */
export function performSearch(
  requestContext: RequestContext,
  entities: EntityObject[],
  searchQueries: (string | null)[],
) {
  const filteredEntities: EntityObject[] = [];
  const searchList = searchQueries.map((v) => v?.toLowerCase());
  for (const entity of entities) {
    let i: number = 1;
    let passed = true;
    const hasNameSearch = searchList[0] != null && searchList[0] != '';
    if (hasNameSearch) {
      if (!entity.name.toLowerCase().includes(searchList[0] as string)) {
        continue;
      }
    }
    for (const option of requestContext.accessedEntityType?.options ?? []) {
      const query = searchList[i++];
      if (query == null || query === '') continue;
      const rawValue = entity.options[option.name];
      // The raw value keys the aliases (the display path in list.ts does the
      // same); lowercase only for the actual comparison. The value, its alias
      // and the alias' tooltip all count, so "24.04" finds a host whose
      // `ubuntu-24.04` is shown as a plain Ubuntu logo.
      const value: string = rawValue == null ? '' : String(rawValue);
      const resolved = resolveAlias(option, value);
      const texts = [value, resolved?.alias, resolved?.tooltip];
      if (!texts.some((text) => text != null && text.toLowerCase().includes(query))) {
        passed = false;
        break;
      }
    }
    if (passed) filteredEntities.push(entity);
  }
  return filteredEntities;
}
