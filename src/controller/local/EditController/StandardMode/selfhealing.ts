/**
 * The functioning is like this:
 *
 *
 * - AdditionalProperty Error:
 *      Delete the key
 *
 * - Type Error:
 *          If default available: Replace with default.
 *          Else, delete (make undefined instead).
 *
 * - Pattern Error: Do not delete it.
 *
 * - Too Many/too few items: Do not do anything.
 *
 * - Required Error: Do not do anything.
 *
 *
 */

import { JsonSchema } from '@jsonforms/core';
import { deepDelete, getAllErrors } from '../../../../utils/schema/dataUtils';
import { getAJV } from '../shared';

/**
 * Assumes that the data will again be validated afterwards (and hence, the new defaults
 * would be inserted, where necessary)
 * @param data
 * @param jsonSchema
 */
export function migrateData(data: any, jsonSchema: JsonSchema) {
  /**
   * Note that one data key can get several errors since they are deduped according
   * to schema path. So expect any dropdown element to get sometimes as many errors as it has
   * options.
   */
  const errs = getAllErrors(data, jsonSchema, getAJV());
  if (errs == null) return;

  const s = new Set();

  for (const error of errs) {
    if (s.has(error.instancePath)) {
      continue;
    }
    const path = error.instancePath.split('/');
    path.shift();

    if (error.keyword === 'additionalProperties') {
      deepDelete(data, path, error.params.additionalProperty);
      s.add(error.instancePath);
    } else if (error.keyword === 'type') {
      deepDelete(data, path, null);
      s.add(error.instancePath);
    } else if (error.keyword === 'const') {
      deepDelete(data, path, null);
      s.add(error.instancePath);
    }
  }
}
