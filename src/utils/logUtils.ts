import type { RequestContext } from './types/internal/request';

/**
 * Determines whether the accessed entity type defines any logs.
 *
 * Used to decide whether the 'Logs' column should be shown in the overview
 * table at all: if no logs are defined, the column is omitted entirely.
 *
 * Kept in a leaf utility module (types-only imports) so both the controller
 * and the view can use it without creating a circular dependency.
 *
 * @param requestContext - The context of the request, including accessed entity type.
 * @returns true if at least one log is defined, false otherwise.
 */
export function hasLogsDefined(requestContext: RequestContext): boolean {
  return (requestContext.accessedEntityType?.logs?.length ?? 0) > 0;
}
