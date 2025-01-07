import _ from 'lodash';

export function removeOldData(data: any, errors: any[] | undefined): boolean {
  if (errors == undefined) return false;
  let hasAltered = false;
  for (const error of errors) {
    if (error.keyword === 'additionalProperties') {
      hasAltered = true;
      const key = error.params.additionalProperty;
      // TODO: Handle deeper cases too!
      if (key in data) {
        delete data[key];
      }
    }
  }
  return hasAltered;
}

export function extractPatch(oldData: any, newData: any) {
  let patch: { [key: string]: any } = {};

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
