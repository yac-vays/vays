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
import { isCustomRenderer } from '../../utils/customTesterUtils';
import LargeStringList from '../../../view/thirdparty-based-components/ifc/LargeStringList/LargeStringList';
import ErrorBox from '../../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import FormComponentTitle from '../../../view/components/FormComponentTitle';

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
      if (uischema.scope == undefined) return false;
      const subschema = resolveSchema(schema, uischema.scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('list_as_string'),
  ),
);
export default withJsonFormsControlProps(ListAsStringRenderer);
