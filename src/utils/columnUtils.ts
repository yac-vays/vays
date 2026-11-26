import { hasLogsDefined } from './logUtils';
import type { AliasPatternDecl, EntityTypeDecl } from './types/api';
import type { RequestContext } from './types/internal/request';

type OptionDecl = EntityTypeDecl['options'][number];

/**
 * The alias a column declares for `value`, or null. Only own string entries
 * count: the value comes from the entity data, and one that names a member of
 * `Object.prototype` ("constructor", "toString", ...) is not an alias.
 */
export function getAlias(
  aliases: { [key: string]: string } | null | undefined,
  value: string,
): string | null {
  if (aliases == null || !Object.hasOwn(aliases, value)) return null;
  const alias: unknown = aliases[value];
  return typeof alias === 'string' ? alias : null;
}

/** The alias of a column value: Markdown to show, and an optional plain-text tooltip. */
export interface ResolvedAlias {
  alias: string;
  tooltip: string | null;
}

/**
 * Longer values are never tested against `alias_patterns`: the patterns come
 * from the (trusted) specs, but the values from the entity data, and a value
 * crafted against a badly written pattern (`(a+)+$`) must not be able to
 * freeze the browser of everybody listing the entities.
 */
export const ALIAS_PATTERN_MAX_VALUE_LENGTH = 256;
/** Distinct values remembered per pattern list (a column has a few dozen). */
const ALIAS_PATTERN_CACHE_SIZE = 1000;

interface CompiledAliasPattern {
  regexp: RegExp;
  alias: string;
  tooltip: string;
}

interface CompiledAliasPatterns {
  rules: CompiledAliasPattern[];
  results: Map<string, ResolvedAlias | null>;
}

// Keyed by the `alias_patterns` array of the type declaration, so a reloaded
// declaration (new array) compiles afresh and the old one is collected.
const compiledAliasPatterns = new WeakMap<object, CompiledAliasPatterns>();

function compileAliasPatterns(patterns: unknown[]): CompiledAliasPatterns {
  const rules: CompiledAliasPattern[] = [];
  for (const pattern of patterns as Partial<AliasPatternDecl>[]) {
    if (pattern == null || typeof pattern.match !== 'string' || typeof pattern.alias !== 'string') {
      continue;
    }
    try {
      rules.push({
        regexp: new RegExp(`^(?:${pattern.match})$`),
        alias: pattern.alias,
        tooltip: typeof pattern.tooltip === 'string' ? pattern.tooltip : '{0}',
      });
    } catch (error) {
      // YAC rejects patterns browsers cannot compile; skip one that slips
      // through instead of breaking the whole list.
      console.warn(`Ignoring alias pattern '${pattern.match}':`, error);
    }
  }
  return { rules, results: new Map() };
}

function matchAliasPatterns(compiled: CompiledAliasPatterns, value: string): ResolvedAlias | null {
  for (const rule of compiled.rules) {
    const groups = rule.regexp.exec(value);
    if (groups == null) continue;
    // Plain text, never Markdown/HTML: the groups are entity data.
    const tooltip = rule.tooltip.replace(/\{(\d+)\}/g, (_, n: string) => groups[Number(n)] ?? '');
    return { alias: rule.alias, tooltip: tooltip === '' ? null : tooltip };
  }
  return null;
}

/**
 * The alias of `value` in a column: its exact entry in `aliases` (see
 * `getAlias`), else the first of the column's `alias_patterns` matching the
 * whole value, else null.
 */
export function resolveAlias(
  option: Pick<OptionDecl, 'aliases' | 'alias_patterns'>,
  value: string,
): ResolvedAlias | null {
  const alias = getAlias(option.aliases, value);
  if (alias != null) return { alias, tooltip: null };

  const patterns: unknown = option.alias_patterns;
  if (!Array.isArray(patterns) || patterns.length === 0) return null;
  if (value.length > ALIAS_PATTERN_MAX_VALUE_LENGTH) return null;

  let compiled = compiledAliasPatterns.get(patterns);
  if (compiled == null) {
    compiled = compileAliasPatterns(patterns);
    compiledAliasPatterns.set(patterns, compiled);
  }
  if (compiled.results.has(value)) return compiled.results.get(value) ?? null;
  const result = matchAliasPatterns(compiled, value);
  if (compiled.results.size >= ALIAS_PATTERN_CACHE_SIZE) compiled.results.clear();
  compiled.results.set(value, result);
  return result;
}

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
