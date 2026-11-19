import iSessionStorage, { StoredListFilters } from '../../../session/storage/SessionStorage';
import { RequestContext } from '../../../utils/types/internal/request';

/**
 * The column filters of the entity list ("search terms"), kept per backend and
 * entity type for the browser tab: they survive leaving the list (e.g. to edit
 * an entity) and coming back. In the list they are positional — index 0 is
 * the name, then one per option of the type — but they are stored by column
 * name, so a change of the type's columns cannot move a filter to another
 * column.
 */
export type SearchTerms = (string | null)[];

/** Whether any column is filtered. */
export function hasActiveFilters(terms: SearchTerms): boolean {
  return terms.some((t) => t != null && t !== '');
}

/** The stored filters of the type, in the column order of the list. */
export function loadSearchTerms(requestContext: RequestContext): SearchTerms {
  const { yacURL, entityTypeName, accessedEntityType } = requestContext;
  if (!yacURL || !entityTypeName || accessedEntityType?.options == null) return [];
  const stored = iSessionStorage.getListFilters(yacURL, entityTypeName);
  if (stored == null) return [];

  const terms: SearchTerms = [typeof stored.name === 'string' ? stored.name : null];
  for (const option of accessedEntityType.options) {
    const term = stored.options[option.name];
    terms.push(typeof term === 'string' ? term : null);
  }
  return hasActiveFilters(terms) ? terms : [];
}

/** Store the filters of the type (none at all removes the entry). */
export function saveSearchTerms(requestContext: RequestContext, terms: SearchTerms): void {
  const { yacURL, entityTypeName, accessedEntityType } = requestContext;
  if (!yacURL || !entityTypeName || accessedEntityType?.options == null) return;
  if (!hasActiveFilters(terms)) {
    iSessionStorage.setListFilters(yacURL, entityTypeName, null);
    return;
  }
  const stored: StoredListFilters = { options: {} };
  if (terms[0]) stored.name = terms[0];
  accessedEntityType.options.forEach((option, i) => {
    const term = terms[i + 1];
    if (term) stored.options[option.name] = term;
  });
  iSessionStorage.setListFilters(yacURL, entityTypeName, stored);
}
