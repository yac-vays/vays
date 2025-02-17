import { JsonSchema, resolveSchema, TesterContext, UISchemaElement } from '@jsonforms/core';

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

  return subschema.type === undefined && subschema.pattern != undefined;
}
