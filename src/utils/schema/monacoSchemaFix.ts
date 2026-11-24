/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Workaround for a yaml-language-server regression (1.23.x, bundled by
 * monaco-yaml): its `getNodeValue` returns the raw TEXT (`node.source`) for
 * boolean nodes. A top-level boolean `const` still compares correctly (the
 * comparator converts the string when the node type is "boolean"), but a
 * boolean nested INSIDE an object/array is handed over as the string
 * "true"/"false" while the compare runs with the container's type — so an
 * object `const` containing any boolean can never match its own value and
 * Monaco shows "Value must be {…}" for a value that IS {…}. (YAC injects such
 * object consts for stored-but-unspecified data, see add_consts.py; AJV and
 * the backend compare correctly, so only the editor squiggle is wrong.)
 *
 * The fix: before a schema reaches monaco-yaml, every non-scalar `const` (and
 * non-scalar `enum` member) is expanded into the equivalent STRUCTURAL schema
 * — per-property scalar consts, exact `required`, `additionalProperties:
 * false`, tuple `items` with exact length for arrays. Scalar consts take the
 * working code path, and the validation semantics are preserved exactly.
 */

function isNonScalar(value: unknown): boolean {
  return value !== null && typeof value === 'object';
}

/** The structural schema exactly equivalent to `const: value`. */
function constToStructure(value: any): any {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      // Tuple validation: item i must match schema i, no more, no fewer.
      items: value.map(constToStructure),
      minItems: value.length,
      maxItems: value.length,
    };
  }
  if (isNonScalar(value)) {
    const properties: { [key: string]: any } = {};
    for (const [key, sub] of Object.entries(value)) {
      properties[key] = constToStructure(sub);
    }
    return {
      type: 'object',
      properties,
      required: Object.keys(value),
      additionalProperties: false,
    };
  }
  return { const: value };
}

// Where subschemas sit in a schema (Draft-7): only there the walk continues.
// Everything else (`default`, `examples`, `enum`, annotations) is data, and
// the keys of a `properties` map are property names — either may contain a
// key called `const` or `enum` that is no keyword.
const SCHEMA_KEYWORDS = new Set([
  'additionalItems',
  'additionalProperties',
  'contains',
  'else',
  'if',
  'items',
  'not',
  'propertyNames',
  'then',
]);
const SCHEMA_LIST_KEYWORDS = new Set(['allOf', 'anyOf', 'items', 'oneOf']);
const SCHEMA_MAP_KEYWORDS = new Set([
  '$defs',
  'definitions',
  'dependencies',
  'patternProperties',
  'properties',
]);

/**
 * Deep-copies `schema` with every non-scalar `const` / `enum` member expanded
 * (see module doc). Apply to every schema handed to monaco-yaml; schemas for
 * AJV / JSON Forms must stay untouched.
 */
export function patchSchemaForMonaco(schema: any): any {
  if (!isNonScalar(schema) || Array.isArray(schema)) {
    return schema;
  }

  const out: { [key: string]: any } = {};
  // The expansions of a non-scalar enum; kept apart from the schema's own anyOf.
  let enumChoices: any[] | null = null;
  for (const [key, value] of Object.entries<any>(schema)) {
    if (key === 'const' && isNonScalar(value)) {
      // Merge the structural expansion in place of the const; annotations
      // (title, description, ...) on the same subschema survive untouched.
      Object.assign(out, constToStructure(value));
    } else if (key === 'enum' && Array.isArray(value) && value.some(isNonScalar)) {
      enumChoices = value.map(constToStructure);
    } else if (Array.isArray(value) && SCHEMA_LIST_KEYWORDS.has(key)) {
      out[key] = value.map(patchSchemaForMonaco);
    } else if (isNonScalar(value) && !Array.isArray(value) && SCHEMA_MAP_KEYWORDS.has(key)) {
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, sub]) => [name, patchSchemaForMonaco(sub)]),
      );
    } else if (SCHEMA_KEYWORDS.has(key)) {
      out[key] = patchSchemaForMonaco(value);
    } else {
      out[key] = isNonScalar(value) ? structuredClone(value) : value;
    }
  }
  if (enumChoices != null) {
    if ('anyOf' in out) out.allOf = [...(out.allOf ?? []), { anyOf: enumChoices }];
    else out.anyOf = enumChoices;
  }
  return out;
}
