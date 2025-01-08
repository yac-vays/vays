import {
  ControlProps,
  isIntegerControl,
  isNumberControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import NumberInput from '../../view/thirdparty-based-components/ifc/NumberInput/NumberInput';
import OverheadLabel from '../../view/thirdparty-based-components/ifc/Label/OverheadLabel';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import { useCallback } from 'react';
import { debounce } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventToValue = (ev: any) =>
  Number.isNaN(ev.target.valueAsNumber) ? undefined : ev.target.valueAsNumber;

export const NumberControl = (props: ControlProps) => {
  if (!props.visible) return <></>;
  const onChange = useCallback(
    debounce(
      (e: React.ChangeEvent<HTMLInputElement>) => props.handleChange(props.path, eventToValue(e)),
      800,
    ),
    [props.path],
  );
  // const [_, onChange, _] = useDebouncedChange(
  //   props.handleChange,
  //   0,
  //   props.data,
  //   props.path,
  //   eventToValue,
  //   800,
  // );

  return (
    <div className="p-1">
      <OverheadLabel
        title={props.schema.title}
        required={props.required || false}
        description={props.description}
      />
      <NumberInput
        id={props.id}
        data={props.data}
        defaultv={props.schema.default}
        placeholder={props.uischema.options?.initial}
        placeholderEditable={props.uischema.options?.initial_editable}
        enabled={props.enabled}
        onChange={onChange}
      />
      <ErrorBox displayError={props.errors} />
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
