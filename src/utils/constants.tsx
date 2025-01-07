export const SUBSCHEMAS = [
  'if',
  'else',
  'then',
  'not',
  'unevaluatedProperties',
  'propertyNames',
  'contains',
  'items',
  'unevaluatedItems',
  'contentSchema',
];
export const SUBSCHEMA_OBJECTS = ['$defs', 'properties', 'patternProperties', 'dependentSchemas'];
export const SUBSCHEMA_ARRAYS = ['oneOf', 'allOf', 'anyOf', 'prefixItems'];

export const GLOBAL_YAC_REGEX = new RegExp('^[a-zA-Z0-9_\\-\\.]{1,200}$');
