/* eslint-disable @typescript-eslint/no-explicit-any */
import { GLOBAL_YAC_REGEX } from '../constants';
import { isNameRequiredByYAC } from '../nameUtils';
import { RequestContext } from '../types/internal/request';
import { ValidateResponse } from '../types/internal/validation';
import { Nullable } from '../types/typeUtils';

const INJECTED_LABEL = 'General';

const INJECTED_NAME_PROPETRY = 'name753984327583297515507489734124497987457185454894315';

export function isInjectedNameKey(s: string) {
  return s === INJECTED_NAME_PROPETRY;
}

const uielt = {
  type: 'Category',
  label: INJECTED_LABEL,
  elements: [],
};

const uiNameControl = {
  type: 'Control',
  scope: `#/properties/${INJECTED_NAME_PROPETRY}`,
};

export function injectGeneralUICategory(valResp: ValidateResponse) {
  if (valResp.ui_schema.elements != undefined) {
    for (const elt of valResp.ui_schema.elements) {
      if (elt.label === INJECTED_LABEL) {
        return;
      }
    }
  }

  if (valResp.ui_schema.elements != null) {
    valResp.ui_schema.elements.unshift(structuredClone(uielt));
  } else {
    valResp.ui_schema.elements = [];
    valResp.ui_schema.type = 'Categorization';
    valResp.ui_schema.elements.unshift(structuredClone(uielt));
  }
}

export function injectControls(valResp: ValidateResponse, elts: any[]) {
  for (const elt of valResp.ui_schema.elements) {
    if (elt.label === INJECTED_LABEL) {
      if (elt.elements.length > 0 && elt.elements[0].options?.renderer === 'info_box') {
        for (const inelt of elts.reverse()) elt.elements.splice(1, 0, inelt);
        return;
      }
      elt.elements.unshift(...elts);
      return;
    }
  }
}

export function injectSettableName(
  valResp: ValidateResponse,
  requestContext: RequestContext,
  name: Nullable<string> = null,
): ValidateResponse {
  valResp = structuredClone(valResp);
  if (valResp.json_schema.properties == undefined) valResp.json_schema.properties = {};
  // valResp = structuredClone(valResp);
  valResp.json_schema.properties[INJECTED_NAME_PROPETRY] = {
    title: 'Entity Name',
    type: 'string',
    pattern: requestContext.accessedEntityType?.name_pattern,
  };

  injectGeneralUICategory(valResp);
  injectControls(valResp, [structuredClone(uiNameControl)]);

  if (isNameRequiredByYAC(requestContext.accessedEntityType)) {
    if (
      valResp.json_schema.required &&
      !valResp.json_schema.required.includes(INJECTED_NAME_PROPETRY)
    )
      valResp.json_schema.required?.push(INJECTED_NAME_PROPETRY);
  }
  if (name != null) {
    valResp.data[INJECTED_NAME_PROPETRY] = name;
  }

  return valResp;
}

export function popSettableName(data: any): Nullable<string> {
  let name = null;
  if (INJECTED_NAME_PROPETRY in data) {
    name = data[INJECTED_NAME_PROPETRY] as string;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete data[INJECTED_NAME_PROPETRY];
  }

  return name;
}

export function isValidDataObject(data: any) {
  if (INJECTED_NAME_PROPETRY in data) {
    if ((data[INJECTED_NAME_PROPETRY] as string).match(GLOBAL_YAC_REGEX)) {
      return true;
    }

    return false;
  }
  return true;
}

export function hasSettableName(data: any): boolean {
  return INJECTED_NAME_PROPETRY in data;
}
