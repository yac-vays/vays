import {
  ControlProps,
  isIntegerControl,
  isNumberControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useDebouncedInput } from '../../view/hooks/useDebouncedInput';
import ErrorRing from '../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import NumberInput from '../../view/thirdparty/components/ifc/NumberInput/NumberInput';
import { matchesJsonType, reportBadData } from '../utils/dataSanitization';
import { multipleOfStep } from '../utils/numberStep';

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
  const onChange = useDebouncedInput(
    (e: React.ChangeEvent<HTMLInputElement>) => handleChange(path, eventToValue(e)),
    800,
  );

  if (!visible) return <></>;

  ///// data check
  if (!matchesJsonType(data, 'number')) {
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
        errors={errors}
        path={path}
      />
      <ErrorRing errors={errors}>
        <NumberInput
          id={id}
          data={data}
          defaultv={schema.default}
          placeholder={uischema.options?.initial}
          placeholderEditable={uischema.options?.initial_editable}
          step={multipleOfStep(schema)}
          enabled={enabled}
          onChange={onChange}
        />
      </ErrorRing>
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
