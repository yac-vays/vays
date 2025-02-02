import { EntityObject } from '../../../utils/types/api';
import { RequestContext } from '../../../utils/types/internal/request';

/**
 * Performs a search on a list of entities based on the provided search queries.
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
    for (const option of requestContext.accessedEntityType?.options!) {
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
