import {
  ControlProps,
  JsonSchema,
  RankedTester,
  rankWith,
  resolveSchema,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/EditorState';
import { tsAddWarningMessage } from '../../controller/global/TroubleShootController';

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
      'No Renderer Found',
      'The schema has constructs which VAYS currently does not support.',
      props.id?.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  return <>{/* <div style={{ color: 'red' }}>Renderer not found</div> */}</>;
};

export const VoidTester: RankedTester = rankWith(
  20,
  (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
    return resolveSchema(schema, (uischema as any).scope, context?.rootSchema) == undefined;
  },
);
