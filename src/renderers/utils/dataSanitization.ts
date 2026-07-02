import { Categorization } from '@jsonforms/core';
import { getCurrentTab } from '../../controller/local/EditController/StandardMode/access';

/**
 * User-facing message for data the renderer cannot display (wrong type or not
 * an allowed value). The renderer shows the field as empty, so the message
 * must carry the stored value: it is the only way the form-only user can see
 * what is currently in the YAML. Entering a new value overwrites it.
 */
export function reportBadData(data: unknown) {
  return (
    `This field holds a value the form cannot display: '${JSON.stringify(data)}'. ` +
    'The field is shown empty; entering a new value will overwrite the stored one.'
  );
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

  if (typeof type === 'string') {
    return typeof data === type;
  } else if (Array.isArray(type)) {
    return type.indexOf(typeof data) !== -1;
  }
  return true; // if no constraints then okay.
}

export function sanitizeCategory(activeCategory: number, cat: Categorization) {
  return activeCategory >= numCategories(cat) ? getCurrentTab() : activeCategory;
}

export function numCategories(cat: Categorization): number {
  return cat.elements.length;
}
