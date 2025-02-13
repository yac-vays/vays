/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';

/**
 * Finds the diff between two objects and returns it in human readable form.
 * @param obj1 The old object
 * @param obj2 The new object
 * @returns
 */
export const getObjectDiff = (obj1: any, obj2: any) => {
  const diff: any = {};

  // Iterate over all keys in the first object and point out changes
  _.forOwn(obj1, (value, key) => {
    if (!_.isEqual(value, obj2[key])) {
      diff[key] = `${value} -> ${obj2[key]}`;
    }

    if (!_.has(obj2, key)) {
      diff[key] = `${value} -> <deleted> `;
    }
  });

  // Check for keys in the second object that are not in the first
  _.forOwn(obj2, (value, key) => {
    if (!_.has(obj1, key)) {
      diff[key] = `${value}  (newly added)`;
      //{ oldValue: undefined, newValue: value };
    }
  });

  return diff;
};

/**
 * Given an object and the json schema for it, try to replace as many keys with the
 * corresponding title as possible.
 * @param obj
 * @param schema
 * @returns
 */
export function transformObjectUsingTitle(obj: { [key: string]: any }, schema: any) {
  const transformedObj = _.cloneDeep(obj); // Create a deep clone to avoid mutation

  // Helper function to recursively process the schema and object
  function processObject(obj: any, schema: any, parentKey: string = ''): any {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => processObject(item, schema.items, index.toString()));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        let propertySchema = _.get(schema, ['properties', key]);

        // Handle oneOf in schema
        if (!propertySchema && schema.oneOf) {
          for (const subSchema of schema.oneOf) {
            propertySchema = _.get(subSchema, ['properties', key]);
            if (propertySchema) break;
          }
        }

        // If there is a title in the schema for this key, replace it
        const newKey: string = propertySchema && propertySchema.title ? propertySchema.title : key;

        // Recursively process nested objects or arrays
        result[newKey] = processObject(value, propertySchema || {}, key);
      }
      return result;
    }

    // If it's a primitive value, just return it
    return obj;
  }

  return processObject(transformedObj, schema);
}
