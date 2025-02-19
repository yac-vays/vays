/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema } from '@jsonforms/core';
import Ajv, { ErrorObject } from 'ajv';
import _ from 'lodash';
import { Nullable } from '../types/typeUtils';

export function removeOldData(
  data: any,
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null,
): boolean {
  if (errors == null) return false;
  let hasAltered = false;
  for (const error of errors) {
    if (error.keyword === 'additionalProperties') {
      hasAltered = true;
      const key: string = error.params.additionalProperty;
      if (error.instancePath === '' && key in data) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete data[key];
      } else if (error.instancePath !== '') {
        const l = (error.instancePath as string).split('/');
        l.shift();
        deepDelete(data, l, key);
      }
    }
  }
  return hasAltered;
}

/**
 * Delete key in the data object, which can be found in instancePath.
 * You typically get this instance path from errors by Ajv.
 * @param data The data object. Will be modified in place.
 * @param instancePath A list of subkeys to access, to get at the target.
 * @param key The target name. Can be null, in this case, the key is extracted from the instancePath.
 * @returns
 */
export function deepDelete(data: any, instancePath: string[], key: Nullable<string>) {
  if (key == null) {
    if (instancePath.length > 0) key = instancePath.pop() as string;
    else return;
  }
  let subdata = data;
  let elt: string | number;

  for (const pth of instancePath) {
    elt = pth;
    //@ts-expect-error isNaN can indeed be used with nonnumber arguments
    if (!isNaN(pth) && Array.isArray(subdata)) {
      elt = Number.parseInt(elt);
    } else if (!(elt in data)) {
      return;
    }

    subdata = data[elt];
  }
  //@ts-expect-error isNaN can indeed be used with nonnumber arguments
  if (Array.isArray(subdata) && !isNaN(key)) {
    if (subdata.length >= Number.parseInt(key)) subdata.splice(Number.parseInt(key), 1);
  } else if (key in subdata) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete subdata[key];
  }
}

/**
 * Get a patch from old to new. This is required for the modify API call in the standard edit mode.
 * @param oldData
 * @param newData
 * @returns
 */
export function extractPatch(oldData: any, newData: any) {
  const patch: { [key: string]: any } = {};

  for (const key of Object.keys(oldData)) {
    if (!(key in newData)) {
      patch[key] = '~undefined';
    } else if (Array.isArray(oldData[key]) || Array.isArray(newData[key])) {
      if (!_.isEqual(oldData[key], newData[key])) {
        patch[key] = _.clone(newData[key]);
      }
    } else if (
      typeof oldData[key] === 'object' &&
      typeof newData[key] === 'object' &&
      oldData[key] != null
    ) {
      patch[key] = extractPatch(oldData[key], newData[key]);
    } else if (!_.isEqual(oldData[key], newData[key])) {
      patch[key] = _.clone(newData[key]);
    }
  }

  for (const key of Object.keys(newData)) {
    if (!(key in oldData)) {
      patch[key] = _.clone(newData[key]);
    }
  }
  return patch;
}

/**
 *
 * @param data
 * @param jsonSchema
 * @param ajv
 * @param badSchemaCallback the callback for the case that the schema is bad (e.g. bad regex).
 * Is a function that receives an error object with the corresponding error raised by Ajv.
 *
 * @assumes the ajv object was initialized using allErrors: true.
 *
 * @returns Null, if the schema cannot be compiled (e.g. due to bad regex patterns).
 * Else it will return a list of all errors in the data object accoring to the json schema.
 */
export function getAllErrors(
  data: any,
  jsonSchema: JsonSchema,
  ajv: Ajv,
  badSchemaCallback: (e: any) => void = () => {},
): Nullable<ErrorObject<string, Record<string, any>, unknown>[]> {
  const validate = ajv.compile(jsonSchema);
  try {
    validate(data);
    return validate.errors ?? [];
  } catch (e: any) {
    badSchemaCallback(e);
    return null;
  }
}
