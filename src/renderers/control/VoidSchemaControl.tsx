import {
  ControlProps,
  JsonSchema,
  RankedTester,
  rankWith,
  resolveSchema,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/access';
import { tsAddWarningMessage } from '../../controller/global/troubleshoot';

/**
 * Void schema renderer that renders false/null schemas
 * such that no error appears in these cases.
 * @param props
 * @returns
 */
export const VoidControl = (props: ControlProps) => {
  //@ts-ignore
  if (props.uischema.type !== 'VerticalLayout') {
    tsAddWarningMessage(
      9,
      'Empty schema to be rendered',
      'The schema has a subschema which is empty (undefined).',
      props.id?.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  return <></>;
};

export const VoidTester: RankedTester = rankWith(
  20,
  (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
    return resolveSchema(schema, (uischema as any).scope, context?.rootSchema) == undefined;
  },
);
