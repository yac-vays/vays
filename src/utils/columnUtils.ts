import { hasLogsDefined } from './logUtils';
import type { RequestContext } from './types/internal/request';

/**
 * Determines whether the accessed entity type defines any links, i.e. whether
 * the 'Links' column is shown in the overview table at all.
 */
export function hasLinksDefined(requestContext: RequestContext): boolean {
  return (requestContext.accessedEntityType?.links?.length ?? 0) > 0;
}

/**
 * Number of trailing meta columns of the overview table (never searchable, no
 * data values): 'Status' (only with logs), 'Links' (only with links) and
 * 'Actions' (always), in this order.
 */
export function numTrailingColumns(requestContext: RequestContext): number {
  return 1 + (hasLogsDefined(requestContext) ? 1 : 0) + (hasLinksDefined(requestContext) ? 1 : 0);
}
