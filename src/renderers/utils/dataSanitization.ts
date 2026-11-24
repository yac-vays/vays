/**
 * User-facing message for data the renderer cannot display (wrong type or not
 * an allowed value). The renderer shows the field as empty, so the message
 * must carry the stored value: it is the only way the form-only user can see
 * what is currently in the YAML. Entering a new value overwrites it.
 */
export function reportBadData(data: unknown) {
  return (
    `${BAD_DATA_PREFIX}: '${JSON.stringify(data)}'. ` +
    'The field is shown empty; entering a new value will overwrite the stored one.'
  );
}

const BAD_DATA_PREFIX = 'This field holds a value the form cannot display';

/**
 * Whether an error line is a {@link reportBadData} message. These are kept
 * visible even in a read-only form (where validation findings are otherwise
 * suppressed): without them the reader would not know the empty field
 * actually holds a value.
 */
export function isBadDataMessage(line: string): boolean {
  return line.startsWith(BAD_DATA_PREFIX);
}

/** The JSON-Schema type names a value belongs to (`typeof` knows neither `integer` nor `null`). */
function jsonTypesOf(data: unknown): string[] {
  if (data === null) return ['null'];
  if (Array.isArray(data)) return ['array'];
  if (typeof data === 'number') return Number.isInteger(data) ? ['integer', 'number'] : ['number'];
  return [typeof data];
}

export function isOfTypeWeak(
  data: unknown,
  type: string | string[] | undefined,
  isArray: boolean = false,
) {
  if (data === undefined) return true;

  if (isArray) {
    if (!Array.isArray(data)) {
      return false;
    }
    return true; // check will happen elsewhere.
  }

  if (type === undefined) return true; // if no constraints then okay.
  const allowed = Array.isArray(type) ? type : [type];
  return jsonTypesOf(data).some((t) => allowed.includes(t));
}

/** The tab to show for `active` when there are `count` tabs. */
export function clampTab(active: number, count: number): number {
  return Math.min(Math.max(active, 0), Math.max(count - 1, 0));
}
