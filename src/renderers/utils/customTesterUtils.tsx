import {
  JsonSchema,
  resolveSchema,
  schemaSubPathMatches,
  Tester,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';

export function isCustomRenderer(name: string) {
  return (uischema: UISchemaElement) => {
    return uischema.options?.renderer === name;
  };
}

export function isUntypedStringInput(
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((uischema as any).scope == undefined) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subschema = resolveSchema(schema, (uischema as any).scope, context?.rootSchema);

  return subschema?.type === undefined && subschema?.pattern != undefined;
}

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.enum !== undefined &&
  schema.enum.length > 0 &&
  (schema.type === 'string' ||
    (schema.type === undefined && schema.enum.every((v: unknown) => typeof v === 'string')));

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => entry.const !== undefined);

/** The items of the array are a choice: a string `enum` or a `oneOf` of consts. */
export const itemsAreChoices: Tester = schemaSubPathMatches('items', (schema, rootSchema) => {
  const resolvedSchema = schema.$ref ? resolveSchema(rootSchema, schema.$ref, rootSchema) : schema;
  return !!resolvedSchema && (hasOneOfItems(resolvedSchema) || hasEnumItems(resolvedSchema));
});
