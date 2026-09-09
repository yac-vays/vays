import {
  JsonSchema,
  RankedTester,
  rankWith,
  resolveSchema,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';

/**
 * Void schema renderer that renders false/null schemas
 * such that no error appears in these cases. (The schema lint reports an
 * unresolvable scope as "Empty schema to be rendered".)
 * @returns
 */
export const VoidControl = () => {
  return <></>;
};

export const VoidTester: RankedTester = rankWith(
  20,
  (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return resolveSchema(schema, (uischema as any).scope, context?.rootSchema) == undefined;
  },
);
