/**
 * The `multipleOf` of a number/integer schema as an input step, if it is a
 * usable one: positive and finite, and an integer on `type: integer` (a
 * fractional multipleOf contradicts the type). Undefined otherwise.
 *
 * Used as the HTML `step` of the number inputs, so the up/down arrows move by
 * `multipleOf` instead of 1.
 */
export function multipleOfStep(schema: {
  type?: unknown;
  multipleOf?: unknown;
}): number | undefined {
  const m = schema.multipleOf;
  if (typeof m !== 'number' || !Number.isFinite(m) || m <= 0) return undefined;
  if (schema.type === 'integer' && !Number.isInteger(m)) return undefined;
  return m;
}
