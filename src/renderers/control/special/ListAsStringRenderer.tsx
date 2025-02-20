import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import LargeStringList from '../../../view/thirdparty/components/ifc/LargeStringList/LargeStringList';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

export const ListAsStringRenderer = (props: ControlProps) => {
  /// data check
  if (!isOfTypeWeak(props.data, 'string')) {
    props.errors = reportBadData(props.data);
    props.data = undefined;
  }
  ///

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
          errors={props.errors}
        />
        {list.length > 0 ? (
          <p>
            <em className="opacity-60">Click any item to start editing it.</em>
          </p>
        ) : (
          <></>
        )}
        <LargeStringList
          handleChange={handleChange}
          path={props.path}
          id={props.id}
          data={list}
          disabled={!props.enabled}
        />
        <ErrorBox displayError={props.errors} />
      </div>
    </>
  );
};

export const ListAsStringTester: RankedTester = rankWith(
  23,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('list_as_string')),
);
export default withJsonFormsControlProps(ListAsStringRenderer);
