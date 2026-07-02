import { ControlProps, isBooleanControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import ErrorButton from '../../view/components/Buttons/ErrorButton';
import ErrorRing from '../../view/components/Form/ErrorRing';
import Checkbox from '../../view/thirdparty/components/ifc/CheckBox/CheckBox';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';
import { resolveInitial } from '../utils/initialHandling';

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

  // `initial` is shown but is not data yet; with `initial_editable: false`
  // (the default) it gets the greyed-out placeholder look until the first
  // click commits a real value.
  const { data: resolvedData, isPlaceholder } = resolveInitial<boolean>(data, uischema);
  data = resolvedData;

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
              placeholder={isPlaceholder}
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
