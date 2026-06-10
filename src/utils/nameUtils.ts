import { EntityTypeDecl, NameGeneratedCond } from './types/api';
import { Nullable } from './types/typeUtils';

/**
 * Returns whether the accessed entity
 * @param requestContext The context
 * @returns
 */
export function isNameGeneratedByYAC(accessedEntityType: Nullable<EntityTypeDecl>) {
  if (!accessedEntityType) return false;
  return accessedEntityType?.name_generated === NameGeneratedCond.enforced;
}

export function isNameOptionalByYAC(accessedEntityType: Nullable<EntityTypeDecl>) {
  if (!accessedEntityType) return false;
  return accessedEntityType?.name_generated === NameGeneratedCond.optional;
}
