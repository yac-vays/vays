import {
  and,
  ControlProps,
  isIntegerControl,
  isNumberControl,
  JsonSchema,
  or,
  RankedTester,
  rankWith,
  schemaTypeIs,
  TesterContext,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useDebouncedChange } from '@jsonforms/material-renderers';
import TextInput from '../../view/thirdparty-based-components/ifc/TextInput/TextInput';
import NumberInput from '../../view/thirdparty-based-components/ifc/NumberInput/NumberInput';
// import { MuiInputText } from '../mui-controls/MuiInputText';
// import { MaterialInputControl } from './MaterialInputControl';

const eventToValue = (ev: any) =>
  Number.isNaN(ev.target.valueAsNumber) ? undefined : ev.target.valueAsNumber;

export const NumberControl = (props: ControlProps) => {
  const [_, onChange, onClear] = useDebouncedChange(
    props.handleChange,
    0,
    props.data,
    props.path,
    eventToValue,
    800,
  );

  return (
    <div className="p-1">
      <NumberInput {...props} onChange={onChange} onClear={onClear} />
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
