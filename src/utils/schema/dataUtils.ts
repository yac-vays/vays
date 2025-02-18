import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeOldData(data: any, errors: any[] | undefined): boolean {
  if (errors == undefined) return false;
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
        l.reverse().pop();
        deepDelete(data, l.reverse(), key);
      }
    }
  }
  return hasAltered;
}

/**
 * Delete key in the data object, which can be found in instancePath.
 * You typically get this instance path from errors by Ajv.
 * @param data
 * @param instancePath
 * @param key
 * @returns
 */
function deepDelete(data: any, instancePath: string[], key: string) {
  let subdata = data;

  for (const elt of instancePath) {
    if (!(elt in data)) {
      return;
    }
    subdata = data[elt];
  }

  if (key in subdata) {
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
