import { useJsonForms } from '@jsonforms/react';
import { isBadDataMessage } from '../../../renderers/utils/dataSanitization';

/**
 * Whether the enclosing form is rendered read-only (the `readonly` prop of
 * `<JsonForms>`, i.e. the edit view's read mode). Read mode shows the stored
 * entity as it is: validation findings are expected there and nothing can be
 * committed, so the error affordances (ring, icon + message, tab dots) are
 * suppressed. Outside a JSON Forms context this is `false`.
 */
export function useFormReadonly(): boolean {
  return useJsonForms().readonly === true;
}

/**
 * The part of a control's error text that is shown given the form's read-only
 * state: everything when editable; in a read-only form only the "value the
 * form cannot display" lines (see `reportBadData`), since those describe the
 * stored data rather than a validation finding. Empty string when nothing is
 * to be shown.
 */
export function visibleFormErrors(errors: string | undefined, readonly: boolean): string {
  if (!errors) return '';
  if (!readonly) return errors;
  return errors.split('\n').filter(isBadDataMessage).join('\n');
}
