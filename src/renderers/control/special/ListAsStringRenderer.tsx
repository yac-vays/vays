import {
  and,
  ControlProps,
  isStringControl,
  or,
  RankedTester,
  rankWith,
  resolveSchema,
  TesterContext,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import LargeStringList from '../../../view/thirdparty/components/ifc/LargeStringList/LargeStringList';
import { isCustomRenderer } from '../../utils/customTesterUtils';

export const ListAsStringRenderer = (props: ControlProps) => {
  const sep = props.uischema.options?.separator ?? ',';
  let list: string[];
  if (props.data) list = (props.data as string).split(sep);
  else list = [];

  const handleChange = (path: string, v: string[]) => {
    props.handleChange(path, v.join(sep));
  };

  return (
    <>
      <div className="pb-4">
        <FormComponentTitle
          hideAddButton
          label={props.label}
          onClick={() => {}}
          description={props.description ?? ''}
          required={props.required}
        />
        {list.length > 0 ? (
          <p>
            <em className="opacity-60">Click any item to start editing it.</em>
          </p>
        ) : (
          <></>
        )}
        <LargeStringList handleChange={handleChange} path={props.path} id={props.id} data={list} />
        <ErrorBox displayError={props.errors} />
      </div>
    </>
  );
};

export const ListAsStringTester: RankedTester = rankWith(
  23,
  and(
    or(isStringControl, (uischema, schema, context: TesterContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((uischema as any).scope == undefined) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subschema = resolveSchema(schema, (uischema as any).scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('list_as_string'),
  ),
);
export default withJsonFormsControlProps(ListAsStringRenderer);
