/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { getAllErrors } from '../../../../utils/schema/dataUtils';
import editStdModeState from '../../../state/EditStdCtrlState';
import { getAJV } from '../shared';

export function registerOnUpdateCategoryErrors(f: (v: boolean[]) => void) {
  editStdModeState.onUpdateCategoryErrors = f;
}

export function getCategoryErrs(): boolean[] | undefined {
  return editStdModeState.catErrs;
}

export function setCategoryErrs(catErrs: boolean[] | undefined) {
  editStdModeState.catErrs = catErrs;
}

export function resetCategoryErrs() {
  setCategoryErrs(undefined);
}

export function updateTabsErrorNotification(
  data: any,
  jsonSchema: JsonSchema,
  uischema: UISchemaElement,
) {
  const errs = getAllErrors(data, jsonSchema, getAJV());
  if (errs == null) return;
  const [categories, struct] = assembleStructure(uischema);
  const catHasErr = categories.map(() => false);
  for (const err of errs) {
    let i = 0;
    for (const cat of categories) {
      let schemaPath = structuredClone(err.schemaPath);
      if (err.keyword === 'required') {
        if (schemaPath === '#/required') schemaPath = schemaPath.replace('#/', '#/properties/');
        schemaPath = schemaPath.replace('/required', '/' + err.params.missingProperty + '/key');
      }
      if (isInCategory(schemaPath, cat, struct.get(cat))) {
        catHasErr[i] = true;
        break;
      }
      i++;
    }
  }
  setCategoryErrs(catHasErr);
  editStdModeState.onUpdateCategoryErrors(catHasErr);
}

/**
 * Do not use this for regular setting of the category Error!
 *
 * This is for special cases only where exactly a single category needs
 * to have an error signal set - don't use in a loop over all categories.
 * Use updateTabsErrorNotification for that instead.
 * @param catName
 * @param err
 * @param uischema
 * @returns
 */
export function setErrorForCategory(catName: string, err: boolean, uischema: UISchemaElement) {
  const [categories] = assembleStructure(uischema);
  const idx = categories.indexOf(catName);
  if (idx === -1) return;

  const v = getCategoryErrs();
  if (!v || v.length <= idx) return; // bad internal state, return.
  v[idx] = err;
  setCategoryErrs(v);
  editStdModeState.onUpdateCategoryErrors(v);
}

type CategoryName = string;
type ParamSchemaPath = string;
type UIStructure = Map<CategoryName, Set<ParamSchemaPath>>;

export function assembleStructure(uischema: UISchemaElement): [string[], UIStructure] {
  return recurse('', uischema) as [string[], UIStructure];
}

/**
 * Currently assumes that Categorization type is top level.
 * Labels are returned seperately to preserve order.
 * @param category
 * @param uischema
 * @returns
 */
function recurse(category: string, uischema: UISchemaElement): [string[], UIStructure | string[]] {
  if (uischema.type === 'Control') {
    return [[], [(uischema as any).scope]];
  }
  if (!(uischema as any).elements) {
    return [[], []];
  }
  const isCat = uischema.type === 'Categorization';
  let labels = [];
  let controlElts: UIStructure | string[] = isCat ? new Map() : [];
  for (const elt of (uischema as any).elements) {
    const label = isCat ? elt.label : category;
    if (isCat) {
      labels.push(label);
    }
    const [lbls, ctrls] = recurse(label, elt);
    labels = labels.concat(lbls);
    if (isCat) {
      (controlElts as UIStructure).set(label, new Set(ctrls as string[]));
    } else {
      controlElts = (controlElts as string[]).concat(ctrls as string[]);
    }
  }

  return [labels, controlElts];
}

function isInCategory(schemaPath: string, cat: string, catContent?: Set<ParamSchemaPath>) {
  if (catContent == undefined) return false;

  for (const value of catContent) {
    if (schemaPath.includes(value)) return true;
  }

  return false;
}
