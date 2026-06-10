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
      const rawValue = entity.options[option.name];
      // The raw value keys the alias table (the display path in list.ts does
      // the same); lowercase only for the actual comparison.
      const value: string = rawValue == null ? '' : String(rawValue);
      const lowerValue = value.toLowerCase();
      if (value in option.aliases) {
        const actualValue: string = option.aliases[value].toLowerCase();
        if (searchList[i] != null && !actualValue.includes(searchList[i] as string)) {
          passed = false;
          break;
        }
      } else if (searchList[i] != null && !lowerValue.includes(searchList[i] as string)) {
        passed = false;
        break;
      } else if (searchList[i] != null && searchList[i] != '' && lowerValue === '') {
        passed = false;
        break;
      }
      i++;
    }
    if (passed) filteredEntities.push(entity);
  }
  return filteredEntities;
}
