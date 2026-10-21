/**
 * Pure model behind the `limit_bar` renderer: a bar
 * showing a `limits` usage split into the share of *this* field's value and
 * the rest ("others", e.g. the other entities of the same group), with the
 * end of this field's share being draggable.
 *
 * YAC reports a usage as `used` (the whole group INCLUDING the entity being
 * edited, with the field value as it was validated) and `max`. To split it,
 * the field's value at validation time is subtracted:
 *
 *   others = used - (value in the validated data ?? initial ?? 0)
 *
 * The validated data (not the value currently shown) is used on purpose:
 * while the user drags, `others` must not move until the next validation
 * reports a usage for the new value.
 */
import { limitLevel, LimitLevel } from './limitUtils';
import { LimitUsage } from './types/api';

export interface LimitBarFieldSchema {
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
}

export interface LimitBarInput {
  /** The usages anchored on this field (already filtered by path). */
  usages: LimitUsage[];
  /** The entity data the usages were measured for (null if unknown). */
  measuredData: unknown;
  /** The field's JSON Forms data path (`a.b.c`). */
  path: string;
  /** The field's current value (undefined = not set). */
  value: number | undefined;
  /** `vays_options.initial`: what an unset field counts as. */
  initial: number | undefined;
  schema: LimitBarFieldSchema;
  /** Granularity of the value (> 0). */
  step: number;
}

export interface LimitBarModel {
  /** The tightest usage (least room left for this field). */
  usage: LimitUsage;
  /** The share of everything but this field. */
  others: number;
  /** This field's share (its value, or `initial` when unset). */
  own: number;
  /** Whether `own` is the `initial` stand-in rather than a set value. */
  ownIsInitial: boolean;
  /** The cap of the usage. */
  max: number;
  /** `max - others - own`; negative when over the cap. */
  free: number;
  /** The right end of the bar: `max`, or more when over the cap. */
  scaleMax: number;
  /** Smallest value the field allows. */
  lo: number;
  /** Largest value the field allows (its own maximum), if any. */
  fieldMax: number | undefined;
  /** Largest value fitting into the cap (`max - others`, never below `lo`). */
  limitHi: number;
  level: LimitLevel;
}

/** Decimal places of a number (e.g. 0.25 → 2), for rounding float noise. */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const s = n.toString();
  const e = s.match(/e-(\d+)$/);
  if (e) return parseInt(e[1], 10);
  return s.split('.')[1]?.length ?? 0;
}

/** Round away float noise (0.1 + 0.2), keeping at least the step's precision. */
export function clean(n: number, step: number): number {
  return Number(n.toFixed(Math.max(decimalsOf(step), 6)));
}

/** Snap to the step grid (relative to 0). */
export function snap(n: number, step: number): number {
  return Number((Math.round(n / step) * step).toFixed(decimalsOf(step)));
}

function snapUp(n: number, step: number): number {
  const s = snap(n, step);
  return s < n - 1e-9 ? Number((s + step).toFixed(decimalsOf(step))) : s;
}

function snapDown(n: number, step: number): number {
  const s = snap(n, step);
  return s > n + 1e-9 ? Number((s - step).toFixed(decimalsOf(step))) : s;
}

/**
 * The step of the bar from the JSON-Schema: `multipleOf` (so every value the
 * bar produces is valid), else `1` for integers and `0.1` for numbers. On an
 * integer field, only an integer `multipleOf` is used.
 */
export function stepFor(schema: { type?: unknown; multipleOf?: unknown }): number {
  const integer = schema.type === 'integer';
  const m = schema.multipleOf;
  if (typeof m === 'number' && Number.isFinite(m) && m > 0 && (!integer || Number.isInteger(m))) {
    return m;
  }
  return integer ? 1 : 0.1;
}

/** Value at a JSON Forms dot path (`a.b.c`), undefined if absent. */
export function valueAtPath(data: unknown, path: string): unknown {
  let cur: unknown = data;
  for (const seg of path.split('.').filter((s) => s !== '')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as { [k: string]: unknown })[seg];
  }
  return cur;
}

const asNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** The field's own bounds from the JSON-Schema, on the step grid. */
export function fieldBounds(
  schema: LimitBarFieldSchema,
  step: number,
): { lo: number; hi: number | undefined } {
  let lo = 0;
  if (asNumber(schema.minimum) !== undefined) lo = snapUp(schema.minimum as number, step);
  if (asNumber(schema.exclusiveMinimum) !== undefined) {
    const ex = schema.exclusiveMinimum as number;
    let v = snapUp(ex, step);
    if (v <= ex + 1e-9) v = Number((v + step).toFixed(decimalsOf(step)));
    lo = asNumber(schema.minimum) !== undefined ? Math.max(lo, v) : v;
  }
  let hi: number | undefined;
  if (asNumber(schema.maximum) !== undefined) hi = snapDown(schema.maximum as number, step);
  if (asNumber(schema.exclusiveMaximum) !== undefined) {
    const ex = schema.exclusiveMaximum as number;
    let v = snapDown(ex, step);
    if (v >= ex - 1e-9) v = Number((v - step).toFixed(decimalsOf(step)));
    hi = hi === undefined ? v : Math.min(hi, v);
  }
  return { lo, hi };
}

/**
 * Build the bar model, or null when no usage is anchored on the field (the
 * renderer then shows a plain number input).
 */
export function buildLimitBar(input: LimitBarInput): LimitBarModel | null {
  const { usages, measuredData, path, value, initial, schema, step } = input;
  if (usages.length === 0) return null;

  const measured = asNumber(valueAtPath(measuredData, path)) ?? initial ?? 0;
  const othersOf = (u: LimitUsage) => Math.max(0, clean(u.used - measured, step));

  // The tightest usage: least room left for this field.
  let usage = usages[0];
  for (const u of usages.slice(1)) {
    if (u.max - othersOf(u) < usage.max - othersOf(usage)) usage = u;
  }
  const others = othersOf(usage);
  const ownIsInitial = value === undefined;
  const own = value ?? initial ?? 0;
  const { lo, hi: fieldMax } = fieldBounds(schema, step);
  const limitHi = Math.max(lo, snapDown(usage.max - others, step));
  const total = clean(others + own, step);
  const free = clean(usage.max - total, step);

  return {
    usage,
    others,
    own,
    ownIsInitial,
    max: usage.max,
    free,
    scaleMax: Math.max(usage.max, total, 0),
    lo,
    fieldMax,
    limitHi,
    // The level of what is shown (own may already differ from the validation).
    level: limitLevel({ ...usage, used: total, ok: total <= usage.max }),
  };
}

/**
 * The range a drag / key press may move the value within: from the field's
 * minimum up to the room left in the cap, never past the field's own maximum.
 * A value already beyond the cap (e.g. the others grew meanwhile) may stay
 * there, so `startValue` widens the upper end — the user can only shrink it.
 */
export function dragRange(model: LimitBarModel, startValue: number): { lo: number; hi: number } {
  let hi = Math.max(model.limitHi, startValue);
  if (model.fieldMax !== undefined) hi = Math.min(hi, model.fieldMax);
  return { lo: model.lo, hi: Math.max(model.lo, hi) };
}

/** Clamp + snap a raw value into a range. */
export function clampToRange(raw: number, range: { lo: number; hi: number }, step: number): number {
  const v = snap(raw, step);
  return Math.min(range.hi, Math.max(range.lo, v));
}

/** The value for a pointer at `fraction` (0…1) of the bar width. */
export function valueAtFraction(
  model: LimitBarModel,
  fraction: number,
  range: { lo: number; hi: number },
  step: number,
): number {
  const f = Math.min(1, Math.max(0, fraction));
  return clampToRange(f * model.scaleMax - model.others, range, step);
}

/** Position (0…100 %) of an absolute amount on the bar. */
export function percentOf(model: LimitBarModel, amount: number): number {
  if (model.scaleMax <= 0) return 0;
  return Math.min(100, Math.max(0, (amount / model.scaleMax) * 100));
}

/**
 * Human formatting: at least the step's precision (2 decimals for sums of
 * finer values, e.g. 0.25 with a step of 0.1), trailing zeros dropped.
 */
export function formatAmount(n: number, step: number): string {
  return Number(n.toFixed(Math.max(decimalsOf(step), 2))).toString();
}
