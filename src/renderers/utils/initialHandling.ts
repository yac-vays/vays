import { UISchemaElement } from '@jsonforms/core';

/**
 * Resolve `vays_options.initial` / `vays_options.initial_editable` for a
 * renderer whose input has no native placeholder concept (checkbox, select,
 * date picker, ...). The text-style inputs (TextInput &co.) keep their own
 * placeholder handling.
 *
 * Semantics (see the schema docs, keyword `vays_options.initial`): while the
 * user has not touched the field, `initial` is *shown* but not part of the
 * data. With `initial_editable: false` (the default) the shown value must be
 * visibly a placeholder — render it greyed out via `isPlaceholder`. With
 * `initial_editable: true` it looks like a regular value from the start.
 * Either way, the first interaction commits a real value (the placeholder
 * look disappears because `data` is then defined).
 */
export function resolveInitial<T>(
  data: T | undefined,
  uischema: UISchemaElement,
): { data: T | undefined; isPlaceholder: boolean } {
  if (data !== undefined) return { data, isPlaceholder: false };

  const initial = uischema.options?.initial as T | undefined;
  if (initial === undefined) return { data, isPlaceholder: false };

  return { data: initial, isPlaceholder: !(uischema.options?.initial_editable ?? false) };
}
