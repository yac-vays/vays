import { ControlProps, isBooleanControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import Checkbox from '../../view/thirdparty/components/ifc/CheckBox/CheckBox';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';

export const BooleanControl = ({
  data,
  visible,
  label,
  // id,
  // enabled,
  // uischema,
  schema,
  // rootSchema,
  handleChange,
  errors,
  path,
  description,
}: ControlProps) => {
  if (!visible) {
    return null;
  }
  let initValue = false;
  if (data != undefined) initValue = data;
  else if (schema.default != undefined) initValue = schema.default;

  return (
    <>
      <div className="p-1">
        <Checkbox
          initValue={initValue}
          title={label}
          onChange={(value: boolean) => handleChange(path, value)}
          description={description}
        />
        <ErrorBox displayError={errors} />
      </div>
    </>
  );
};

export const BooleanControlTester: RankedTester = rankWith(22, isBooleanControl);
export default withJsonFormsControlProps(BooleanControl);
