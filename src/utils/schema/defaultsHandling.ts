/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { stringify } from 'yaml';

import { JsonSchema } from '@jsonforms/core';
import { showError } from '../../controller/global/notification';
import { navigateToURL } from '../../controller/global/url';
import {
  getAJV,
  getPreviousDefaultsObject,
  setPreviousDefaultsObject,
} from '../../controller/local/EditController/shared';
import { logError } from '../logger';
import { ValidateResponse } from '../types/internal/validation';

/**
 * Retunrs whether the data has been removed.
 * @param newDefault
 * @param oldDefault
 * @param oldObject
 */
function _refreshDefaults(
  newDefault: Readonly<any>,
  oldDefault: Readonly<any>,
  oldObject: any,
): {
  removedData: boolean;
  modified: boolean;
} {
  // So far ignores additions of new defaults (i.e. in newDeault, not in oldDef)
  let remSym = false;
  let mod = false;
  for (const key of Object.keys(oldDefault)) {
    if (!(key in newDefault)) {
      remSym = true;
      mod = true;
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete oldObject[key];
    } else if (!(key in oldObject)) {
      continue;
    } else if (
      typeof oldObject[key] === 'object' &&
      oldObject[key] != null &&
      !Array.isArray(oldObject[key])
    ) {
      const ret = _refreshDefaults(newDefault[key], oldDefault[key], oldObject[key]);
      remSym ||= ret.removedData;
      mod ||= ret.modified;
      // Changing the default value
    } else if (!_.isEqual(oldDefault[key], newDefault[key])) {
      oldObject[key] = _.clone(newDefault[key]);
      mod = true;
    }
  }

  for (const key of Object.keys(newDefault)) {
    if (!(key in oldDefault)) {
      // Adding new default value
      oldObject[key] = _.clone(newDefault[key]);
      mod = true;
    }
  }

  return { removedData: remSym, modified: mod };
}

function _extractDefaults(schema: JsonSchema) {
  const newDefault = {};
  try {
    const validate = getAJV().compile(schema);
    validate(newDefault);
  } catch (e: any) {
    showError('Faulty YAC Config: Schema Error', e.toString());
    navigateToURL('/');
  }
  return newDefault;
}

/**
 * Adds the new parameter defaults, modifies existing ones
 * if needed and removes no longer present ones.
 * @param valResp
 * @returns Whether the data has been changed.
 */
export function updateDefaults(valResp: ValidateResponse): boolean {
  if (getPreviousDefaultsObject() == null) {
    logError(
      'Controller internal state invariant violated: previousDefaults is null',
      'EditController/updateDefaults',
    );
    return false;
  }

  const newDefault = _extractDefaults(valResp.json_schema);
  const ret = _refreshDefaults(newDefault, getPreviousDefaultsObject(), valResp.data);

  setPreviousDefaultsObject(newDefault);
  return ret.modified || ret.removedData;
}

/**
 *
 * @param valResp The validation response which includes the JSON schema and the data.
 */
export function insertDefaults(valResp: ValidateResponse) {
  const data = _extractDefaults(valResp.json_schema);

  setPreviousDefaultsObject(structuredClone(data));
  valResp.data = data;
}

export function mergeDefaults(valResp: ValidateResponse): boolean {
  const defaults = _extractDefaults(valResp.json_schema);
  setPreviousDefaultsObject(structuredClone(defaults));

  const mergeResult = _.assign(defaults, structuredClone(valResp.data));
  const isEqual = _.isEqual(mergeResult, valResp.data);

  valResp.data = mergeResult;
  return !isEqual;
}

export function getDefaultsAsYAML(json_schema: JsonSchema): string {
  const defaults = _extractDefaults(json_schema);
  return `---\n# Automatically generated by VAYS\n\n${stringify(defaults)}`;
}
