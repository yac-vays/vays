import { ControlProps, isBooleanControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import ErrorButton from '../../view/components/Buttons/ErrorButton';
import ErrorRing from '../../view/components/Form/ErrorRing';
import Checkbox from '../../view/thirdparty/components/ifc/CheckBox/CheckBox';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

export const BooleanControl = ({
  data,
  visible,
  label,
  // id,
  enabled,
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
        <div className="flex flex-row items-center">
          <ErrorRing errors={errors}>
            <Checkbox
              initValue={data}
              title={label}
              onChange={(value: boolean) => handleChange(path, value)}
              description={description}
              disabled={!enabled}
              isMarkdownDesc
            />
          </ErrorRing>
          {errors ? (
            <div className="relative ml-2">
              <ErrorButton content={errors} />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};

export const BooleanControlTester: RankedTester = rankWith(22, isBooleanControl);
export default withJsonFormsControlProps(BooleanControl);
