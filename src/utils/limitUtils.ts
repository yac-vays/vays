/**
 * Shared logic for the `limits` usage indicators: the same level (color),
 * formatting and path-matching rules are used by the form-field chips, the
 * meta-panel chips next to the entity name and the YAML editor's gutter
 * glyphs / field-help hover, so all surfaces always agree.
 *
 * A limit's optional `path` is a data-loc in YAC's usual `#/key/subkey`
 * syntax (like `data_loc`), e.g. `#/cpus` or `#/disks/data_gb`. Array
 * indices are deliberately unsupported: a limit sums over entities, not
 * array items — a path naming an array field matches the field itself.
 */
import { LimitUsage } from './types/api';
import { subschemaAtPath } from './schema/fieldHelp';

export type LimitLevel = 'ok' | 'near' | 'over';

/** Usage ratio from which a still-ok limit is shown in amber. */
export const NEAR_LIMIT_RATIO = 0.8;

export function limitLevel(u: LimitUsage): LimitLevel {
  if (!u.ok) return 'over';
  return u.max > 0 && u.used / u.max >= NEAR_LIMIT_RATIO ? 'near' : 'ok';
}

/** Chip colors per level (green / amber / red, on translucent backgrounds). */
export const LIMIT_CHIP_STYLE: Record<LimitLevel, { backgroundColor: string; color: string }> = {
  ok: { backgroundColor: 'rgb(34 197 94 / 0.15)', color: 'rgb(21 128 61)' },
  near: { backgroundColor: 'rgb(245 158 11 / 0.18)', color: 'rgb(180 83 9)' },
  over: { backgroundColor: 'rgb(239 68 68 / 0.15)', color: 'rgb(185 28 28)' },
};

/** Compact chip text, e.g. `3/5`. */
export function formatLimitShort(u: LimitUsage): string {
  return `${u.used}/${u.max}`;
}

/** Hover/tooltip text, e.g. `VMs per owner: 3 of 5 used`. */
export function formatLimitLong(u: LimitUsage): string {
  return `${u.title}: ${u.used} of ${u.max} used`;
}

/** `'#/a/b'` -> `['a', 'b']` (root marker and empty segments dropped). */
export function limitPathSegments(path: string): string[] {
  const segs = path
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (segs[0] === '#') segs.shift();
  return segs;
}

/** Whether a limit path names exactly the given jsonforms data path (`a.b`). */
export function limitMatchesFormPath(limitPath: string, formPath: string): boolean {
  const limSegs = limitPathSegments(limitPath);
  const formSegs = formPath.split('.').filter((s) => s !== '');
  return (
    limSegs.length > 0 &&
    limSegs.length === formSegs.length &&
    limSegs.every((s, i) => s === formSegs[i])
  );
}

/** Whether a limit path names exactly the given yaml-AST path (indices stringified). */
export function limitMatchesYamlPath(limitPath: string, segments: (string | number)[]): boolean {
  const limSegs = limitPathSegments(limitPath);
  return limSegs.length === segments.length && limSegs.every((s, i) => s === String(segments[i]));
}

/** The usages anchored on the form field at `formPath`. */
export function usagesForFormPath(usages: LimitUsage[], formPath?: string): LimitUsage[] {
  if (!formPath) return [];
  return usages.filter((u) => u.path != null && limitMatchesFormPath(u.path, formPath));
}

/**
 * The usages shown next to the entity name: those without a `path`, plus
 * those whose path does not resolve in the current schema (typo, or a field
 * currently hidden by `yac_if`) — a chip must never silently disappear.
 */
export function metaPanelUsages(usages: LimitUsage[], jsonSchema: unknown): LimitUsage[] {
  return usages.filter(
    (u) => u.path == null || subschemaAtPath(jsonSchema, limitPathSegments(u.path)) == null,
  );
}
