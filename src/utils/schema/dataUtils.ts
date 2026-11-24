/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema } from '@jsonforms/core';
import Ajv, { ErrorObject } from 'ajv';
import _ from 'lodash';
import { Nullable } from '../types/typeUtils';

/**
 * Path segments that reach an object's prototype instead of its data. Paths
 * are derived from the keys of entity data (via Ajv errors), so walking or
 * writing along one of these would read or pollute `Object.prototype` for the
 * whole page. The path helpers below refuse them and only follow own keys.
 */
const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function isUnsafePath(path: readonly (string | null)[]): boolean {
  return path.some((seg) => seg != null && UNSAFE_SEGMENTS.has(seg));
}

function hasOwn(obj: any, key: string | number): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Delete every property the schema rejected as `additionalProperties` from
 * `data` (in place) and return the path of each removed key (segment arrays,
 * e.g. `['networking', 'extra']`). The caller uses these to re-emit the
 * removals as `~undefined` in the outgoing patch (see `editingState.strippedPaths`).
 */
export function removeOldData(
  data: any,
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null,
): string[][] {
  if (errors == null) return [];
  const removed: string[][] = [];
  for (const error of errors) {
    if (error.keyword === 'additionalProperties') {
      const key: string = error.params.additionalProperty;
      if (isUnsafePath([key])) continue;
      if (error.instancePath === '' && hasOwn(data, key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete data[key];
        removed.push([key]);
      } else if (error.instancePath !== '') {
        const l = (error.instancePath as string).split('/');
        l.shift();
        // Only report paths that were actually deleted; otherwise the caller
        // would keep re-validating data that never changes.
        if (deepDelete(data, l, key)) removed.push([...l, key]);
      }
    }
  }
  return removed;
}

/**
 * Set `~undefined` (YAC's "unset this key" sentinel) at `path` inside the patch
 * `payload`, creating any missing intermediate objects. Used to turn a removal
 * detected by `removeOldData` into an explicit unset the additive YAML merge can
 * act on.
 *
 * Array contents are sent wholesale by `extractPatch`, so removals nested inside
 * an array are already covered by that replacement; we bail rather than
 * materialise a (sparse) array here, which would corrupt the merge.
 */
export function setUndefinedAtPath(payload: any, path: string[]): void {
  if (path.length === 0 || payload == null || typeof payload !== 'object') return;
  if (isUnsafePath(path)) return;
  let cur = payload;
  for (let i = 0; i < path.length - 1; i++) {
    if (Array.isArray(cur)) return;
    const seg = path[i];
    if (!hasOwn(cur, seg) || cur[seg] == null || typeof cur[seg] !== 'object') {
      // Would need to step through an array index next — leave it to extractPatch.
      // @ts-expect-error isNaN accepts non-number arguments
      if (!isNaN(path[i + 1])) return;
      cur[seg] = {};
    }
    cur = cur[seg];
  }
  if (Array.isArray(cur)) return;
  cur[path[path.length - 1]] = '~undefined';
}

/**
 * Whether `path` (segment array) resolves to an existing key in `data`.
 */
export function hasAtPath(data: any, path: string[]): boolean {
  if (isUnsafePath(path)) return false;
  let cur = data;
  for (const seg of path) {
    if (cur == null || typeof cur !== 'object') return false;
    const key: any = Array.isArray(cur) ? Number.parseInt(seg) : seg;
    if (!hasOwn(cur, key)) return false;
    cur = cur[key];
  }
  return true;
}

/**
 * Delete key in the data object, which can be found in instancePath.
 * You typically get this instance path from errors by Ajv.
 * @param data The data object. Will be modified in place.
 * @param instancePath A list of subkeys to access, to get at the target.
 * @param key The target name. Can be null, in this case, the key is extracted from the instancePath.
 * @returns Whether something was actually deleted.
 */
export function deepDelete(data: any, instancePath: string[], key: Nullable<string>): boolean {
  if (key == null) {
    if (instancePath.length > 0) key = instancePath.pop() as string;
    else return false;
  }
  if (isUnsafePath([...instancePath, key])) return false;
  let subdata = data;
  let elt: string | number;

  for (const pth of instancePath) {
    elt = pth;
    //@ts-expect-error isNaN can indeed be used with nonnumber arguments
    if (!isNaN(pth) && Array.isArray(subdata)) {
      elt = Number.parseInt(elt);
    } else if (subdata == null || typeof subdata !== 'object' || !hasOwn(subdata, elt)) {
      return false;
    }

    subdata = subdata[elt];
  }
  //@ts-expect-error isNaN can indeed be used with nonnumber arguments
  if (Array.isArray(subdata) && !isNaN(key)) {
    const idx = Number.parseInt(key);
    if (subdata.length > idx) {
      subdata.splice(idx, 1);
      return true;
    }
  } else if (subdata != null && typeof subdata === 'object' && hasOwn(subdata, key)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete subdata[key];
    return true;
  }
  return false;
}

/**
 * `newData` plus `~undefined` for every (deep) object key of `oldData` it no
 * longer has. For sending FULL data that YAC merges additively into
 * `yaml_base` (create mode): without the markers, removed keys would survive
 * in the merged YAML. Arrays are replaced as a whole by the merge anyway.
 */
export function markRemovedKeys(oldData: any, newData: any) {
  const out: { [key: string]: any } = { ...newData };
  for (const key of Object.keys(oldData ?? {})) {
    if (!(key in newData)) {
      out[key] = '~undefined';
    } else if (_.isPlainObject(oldData[key]) && _.isPlainObject(newData[key])) {
      out[key] = markRemovedKeys(oldData[key], newData[key]);
    }
  }
  return out;
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
      oldData[key] != null &&
      newData[key] != null
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
