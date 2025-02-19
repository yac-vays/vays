/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { getAllErrors } from '../../../../utils/schema/dataUtils';
import editStdModeState from '../../../state/EditStdCtrlState';
import { getAJV } from '../shared';

export function registerOnUpdateCategoryErrors(f: (v: boolean[]) => void) {
  editStdModeState.onUpdateCategoryErrors = f;
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
        schemaPath = schemaPath.replace('#/', '#/properties/');
        schemaPath = schemaPath.replace('/required', '/' + err.params.missingProperty + '/key');
      }
      console.error(schemaPath);
      if (isInCategory(schemaPath, cat, struct.get(cat))) {
        console.error('YES');
        catHasErr[i] = true;
        break;
      }
      i++;
    }
  }
  editStdModeState.onUpdateCategoryErrors(catHasErr);
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
      console.log(label);
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
  console.error('Search ' + schemaPath + ' in ' + cat);
  console.error(catContent);

  if (catContent == undefined) return false;

  for (const value of catContent) {
    if (schemaPath.includes(value)) return true;
    console.error(value);
  }

  return false;
}
