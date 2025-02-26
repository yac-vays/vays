import { Categorization } from '@jsonforms/core';
import { getCurrentTab } from '../../controller/local/EditController/StandardMode/access';

export function reportBadData(data: unknown) {
  return `Found bad data - This is currently is set to '${JSON.stringify(data)}'`;
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
    return type.indexOf(typeof data);
  }
  return true; // if no constraints then okay.
}

export function sanitizeCategory(activeCategory: number, cat: Categorization) {
  return activeCategory >= numCategories(cat) ? getCurrentTab() : activeCategory;
}

export function numCategories(cat: Categorization): number {
  return cat.elements.length;
}
