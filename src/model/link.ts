import { ActionDecl } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { createDerivedEntity } from './copy';

/**
 * Create a link to an existing entity (a shallow copy that keeps following its
 * source). Thin wrapper around {@link createDerivedEntity}.
 */
export async function linkEntity(
  entityName: string | undefined,
  linkEntityName: string,
  actions: ActionDecl[],
  requestContext: RequestContext,
): Promise<{ success: Nullable<boolean>; name: Nullable<string> }> {
  return createDerivedEntity('link', entityName, linkEntityName, actions, requestContext);
}
