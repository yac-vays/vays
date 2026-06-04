/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema, toDataPath, UISchemaElement } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
import { getAllErrors } from '../../../../utils/schema/dataUtils';
import {
  controlOwnsPath,
  instancePathToDotted,
} from '../../../../utils/schema/locatedErrors';
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

/**
 * Compute the dotted instance path of the control an AJV error belongs to.
 * `required` errors carry the offending key in `params.missingProperty` rather
 * than the instance path, so it is appended explicitly.
 */
function errorControlPath(err: ErrorObject): string {
  let dotted = instancePathToDotted((err as any).instancePath ?? (err as any).dataPath ?? '');
  const missing = (err.params as any)?.missingProperty;
  if (err.keyword === 'required' && typeof missing === 'string') {
    dotted = dotted ? `${dotted}.${missing}` : missing;
  }
  return dotted;
}

/**
 * Light the tab (category) of every field that currently has an error.
 *
 * Errors are taken from the same AJV/schema/data that JSON Forms renders inline
 * (`getAllErrors`) plus the backend-located `additionalErrors`, so the tab dots
 * stay in sync with what the user actually sees on the controls. Each error is
 * mapped to its category by exact/descendant control-path matching (not the
 * fragile substring match used previously, which mis-attributed e.g. an error
 * on `system_type` to a category owning `system`).
 */
export function updateTabsErrorNotification(
  data: any,
  jsonSchema: JsonSchema,
  uischema: UISchemaElement,
  additionalErrors: ErrorObject[] = [],
) {
  const errs = getAllErrors(data, jsonSchema, getAJV());
  if (errs == null) return;
  const allErrs = [...errs, ...additionalErrors];
  const [categories, struct] = assembleStructure(uischema);
  const catHasErr = categories.map(() => false);
  for (const err of allErrs) {
    const errPath = errorControlPath(err);
    let i = 0;
    for (const cat of categories) {
      if (isInCategory(errPath, struct.get(cat))) {
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
/** Dotted instance path of a control, e.g. `users_root` or `networking.gateway`. */
type ControlPath = string;
type UIStructure = Map<CategoryName, Set<ControlPath>>;

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
    return [[], [toDataPath((uischema as any).scope)]];
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

function isInCategory(errPath: string, catContent?: Set<ControlPath>) {
  if (catContent == undefined || errPath === '') return false;

  for (const controlPath of catContent) {
    if (controlOwnsPath(controlPath, errPath)) return true;
  }

  return false;
}
