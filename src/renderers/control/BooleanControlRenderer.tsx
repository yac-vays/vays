import { ControlProps, isBooleanControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import Checkbox from '../../view/thirdparty/components/ifc/CheckBox/CheckBox';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

export const BooleanControl = ({
  data,
  visible,
  label,
  // id,
  // enabled,
  uischema,
  // rootSchema,
  handleChange,
  errors,
  path,
  description,
}: ControlProps) => {
  if (!visible) {
    return null;
  }

  // placeholder is always editable for booleans.
  if (data == undefined) {
    data = uischema.options?.initial;
  }

  ///////// check data
  if (!isOfTypeWeak(data, 'boolean')) {
    errors = reportBadData(data);
    data = false;
  }
  /////////

  return (
    <>
      <div className="p-1">
        <Checkbox
          initValue={data}
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
