import { ActionDecl } from './types/api';
import { RequestContext } from './types/internal/request';
import { Nullable } from './types/typeUtils';

/**
 * The uniform toast title for everything concerning one entity:
 * `{backend} / {type} / {entityName}`. Parts that are unknown (e.g. no entity
 * name yet while creating) are simply skipped.
 */
export function entityToastTitle(
  requestContext: RequestContext,
  entityName?: Nullable<string>,
): string {
  return [
    requestContext.backendObject?.title,
    requestContext.accessedEntityType?.title ?? requestContext.entityTypeName,
    entityName,
  ]
    .filter(Boolean)
    .join(' / ');
}

/**
 * The uniform operation-success sentence, folding in the actions that were
 * triggered alongside: `Delete of foo was successful!`,
 * `Delete of foo and Wipe Disks were successful!`,
 * `Create of foo, Wipe Disks and Start Installation were successful!`.
 */
export function operationSuccessText(operation: string, actions: ActionDecl[] = []): string {
  const parts = [operation, ...actions.map((a) => a.title || a.name)];
  if (parts.length === 1) return `${operation} was successful!`;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]} were successful!`;
}
