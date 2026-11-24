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
} from '../../controller/local/EditController/editState';
import { getCachedConfig } from '../../model/config';
import { logError } from '../logger';
import { ValidateResponse } from '../types/internal/validation';

/**
 * Bring `oldObject` (the data) from the old defaults to the new ones: a value
 * still equal to its old default follows the default (changed or gone), new
 * defaults are added. A value the user changed is left alone.
 * @returns whether data was removed / modified at all.
 */
function _refreshDefaults(
  newDefault: Readonly<any>,
  oldDefault: Readonly<any>,
  oldObject: any,
): {
  removedData: boolean;
  modified: boolean;
} {
  let remSym = false;
  let mod = false;
  for (const key of Object.keys(oldDefault)) {
    if (!(key in oldObject)) continue;
    const untouched = _.isEqual(oldObject[key], oldDefault[key]);
    if (!(key in newDefault)) {
      if (untouched) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete oldObject[key];
        remSym = true;
        mod = true;
      }
    } else if (
      _.isPlainObject(oldObject[key]) &&
      _.isPlainObject(oldDefault[key]) &&
      _.isPlainObject(newDefault[key])
    ) {
      const ret = _refreshDefaults(newDefault[key], oldDefault[key], oldObject[key]);
      remSym ||= ret.removedData;
      mod ||= ret.modified;
    } else if (untouched && !_.isEqual(oldDefault[key], newDefault[key])) {
      oldObject[key] = _.clone(newDefault[key]);
      mod = true;
    }
  }

  for (const key of Object.keys(newDefault)) {
    if (!(key in oldDefault) && !(key in oldObject)) {
      // Adding new default value
      oldObject[key] = _.clone(newDefault[key]);
      mod = true;
    }
  }

  return { removedData: remSym, modified: mod };
}

/** Let the schema insert the defaults `data` lacks (in place, at any depth). */
function _applyDefaults(schema: JsonSchema, data: any) {
  try {
    const validate = getAJV().compile(schema);
    validate(data);
  } catch (e: any) {
    showError('Faulty YAC Config: Schema Error', e.toString());
    navigateToURL('/');
  }
}

function _extractDefaults(schema: JsonSchema) {
  const newDefault = {};
  _applyDefaults(schema, newDefault);
  return newDefault;
}

/**
 * Insert the schema's defaults into the data wherever a key is missing, also
 * inside existing nested objects and array items. Existing values are kept.
 * @returns Whether the data has been changed.
 */
export function fillDefaults(valResp: ValidateResponse): boolean {
  const filled = structuredClone(valResp.data);
  _applyDefaults(valResp.json_schema, filled);
  const changed = !_.isEqual(filled, valResp.data);
  valResp.data = filled;
  return changed;
}

/**
 * Adds the new parameter defaults, modifies existing ones
 * if needed and removes no longer present ones.
 *
 * Note that it will only modify parameters if the defaults object has actually changed.
 *
 * This is used for creating a new entity, in which some settings may change the defaults throughout
 * the object in question.
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
 * Inserts the default at the beginning of *creating* a new entity, at the beginning.
 *
 * @param valResp The validation response which includes the JSON schema and the data.
 */
export function insertDefaults(valResp: ValidateResponse) {
  const data = _extractDefaults(valResp.json_schema);

  setPreviousDefaultsObject(structuredClone(data));
  valResp.data = data;
}

/**
 * Insert the defaults the existing data lacks (see {@link fillDefaults}) and
 * remember the schema's defaults object.
 *
 * Used for editing, where new defaults are entered but existing data is not
 * changed.
 * @returns Whether the data has been changed.
 */
export function mergeDefaults(valResp: ValidateResponse): boolean {
  setPreviousDefaultsObject(_extractDefaults(valResp.json_schema));
  return fillDefaults(valResp);
}

/**
 * The initial create-mode document as YAML. Serialized from the loaded data —
 * NOT re-derived from the schema's defaults: the load pass may have generated
 * values beyond the defaults (`injectEagerRandomStrings`), and the seeded
 * canonical YAML must contain everything the canonical data holds, or those
 * values silently miss the save payload until the first form edit re-merges.
 */
export function getInitialCreateYAML(data: unknown): string {
  return `---\n${initialYAMLComment()}${stringify(data)}`;
}

/** The comment written into generated YAML documents unless `yamlComment` is configured. */
export const DEFAULT_YAML_COMMENT = 'Automatically generated by VAYS';

/**
 * The `# ...` comment block (plus the blank line separating it from the data)
 * for {@link getInitialCreateYAML}, taken from the app config's `yamlComment`
 * or {@link DEFAULT_YAML_COMMENT}. Every line of the configured text becomes
 * its own comment line; an empty text yields no comment at all.
 */
function initialYAMLComment(): string {
  const text = getCachedConfig()?.yamlComment ?? DEFAULT_YAML_COMMENT;
  if (text.trim() === '') return '';
  return (
    text
      .split('\n')
      .map((line) => (line.trim() === '' ? '#' : `# ${line}`))
      .join('\n') + '\n\n'
  );
}
