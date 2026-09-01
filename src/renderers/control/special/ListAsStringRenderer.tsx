import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import LargeStringList from '../../../view/thirdparty/components/ifc/LargeStringList/LargeStringList';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

export const ListAsStringRenderer = (props: ControlProps) => {
  /// data check (derived locally — props are shared and must not be mutated)
  let data = props.data;
  let errors = props.errors;
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  const sep = props.uischema.options?.renderer_options?.separator ?? ',';
  let list: string[];
  if (data) list = (data as string).split(sep);
  else list = [];

  const handleChange = (path: string, v: string[]) => {
    props.handleChange(path, v.join(sep));
  };

  return (
    <>
      <div className="p-1 pb-4">
        <FormComponentTitle
          hideAddButton
          label={props.label}
          onClick={() => {}}
          description={props.description}
          required={props.required}
          errors={errors}
          path={props.path}
        />
        {list.length > 0 ? (
          <p>
            <em className="opacity-60">Click any item to start editing it.</em>
          </p>
        ) : (
          <></>
        )}
        {/* The list draws its own red border on error (same as the
            big_string_list renderer), so no extra ErrorRing here. */}
        <LargeStringList
          handleChange={handleChange}
          path={props.path}
          id={props.id}
          data={list}
          disabled={!props.enabled}
          error={!!errors}
        />
      </div>
    </>
  );
};

export const ListAsStringTester: RankedTester = rankWith(
  23,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('list_as_string')),
);
export default withJsonFormsControlProps(ListAsStringRenderer);
