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

/**
 * Whether `name` matches the WHOLE `pattern`, like YAC's check (fullmatch).
 * A pattern JavaScript cannot compile (Python-only syntax) is left to the
 * backend.
 */
export function matchesNamePattern(name: string, pattern: Nullable<string> | undefined): boolean {
  if (!pattern) return true;
  try {
    return new RegExp(`^(?:${pattern})$`).test(name);
  } catch {
    return true;
  }
}
