import {
  ControlProps,
  isIntegerControl,
  isNumberControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import NumberInput from '../../view/thirdparty/components/ifc/NumberInput/NumberInput';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventToValue = (ev: any) =>
  Number.isNaN(ev.target.valueAsNumber) ? undefined : ev.target.valueAsNumber;

export const NumberControl = ({
  visible,
  data,
  path,
  handleChange,
  label,
  required,
  id,
  schema,
  description,
  enabled,
  uischema,
  errors,
}: ControlProps) => {
  if (!visible) return <></>;
  const onChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => handleChange(path, eventToValue(e)), 800),
    [path],
  );

  ///// data check
  if (!isOfTypeWeak(data, 'number')) {
    errors = reportBadData(data);
    data = undefined;
  }
  //////

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={label}
        required={required || false}
        description={description}
      />
      <NumberInput
        id={id}
        data={data}
        defaultv={schema.default}
        placeholder={uischema.options?.initial}
        placeholderEditable={uischema.options?.initial_editable}
        enabled={enabled}
        onChange={onChange}
      />
      <ErrorBox displayError={errors} />
    </div>
  );
};

export const NumberControlTester: RankedTester = rankWith(
  22,
  or(isNumberControl, isIntegerControl),
  // and(
  //   or(
  //       schemaTypeIs("number"),
  //       schemaTypeIs("integer")
  //   ),
  //   uiTypeIs("Control")
  // )
);
export default withJsonFormsControlProps(NumberControl);
