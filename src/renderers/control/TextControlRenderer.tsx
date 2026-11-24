import {
  ControlElement,
  ControlProps,
  isStringControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useDebouncedInput } from '../../view/hooks/useDebouncedInput';
import ErrorButton from '../../view/components/Buttons/ErrorButton';
import ErrorRing from '../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../view/thirdparty/components/ifc/TextInput/TextInput';
import { isUntypedStringInput } from '../utils/customTesterUtils';
import { matchesJsonType, reportBadData } from '../utils/dataSanitization';

const eventToValue = (ev: React.ChangeEvent<HTMLInputElement>) => ev.target.value;
/**
 * Strict conversion - if the string is empty, then the value written down must be undefined,
 * which will remove the key from the data.
 * @param ev
 * @returns
 */
const strictEventToValue = (ev: React.ChangeEvent<HTMLInputElement>) =>
  ev.target.value ? ev.target.value : undefined;

export const TextControl = (props: ControlProps) => {
  // An item of a string array (scope `#`) cannot be removed by its own input:
  // unsetting an index would leave a null element, so it is emptied instead.
  const isArrayItem = (props.uischema as ControlElement).scope === '#';
  const sendTrivial =
    isArrayItem || (props.uischema.options?.renderer_options?.send_trivial ?? false);

  const onChange = useDebouncedInput(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      props.handleChange(props.path, sendTrivial ? eventToValue(e) : strictEventToValue(e)),
    1500,
  );

  if (!props.visible) return <></>;

  let data = props.data;
  let errors = props.errors;

  /// data check
  if (!matchesJsonType(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  // Label-less usage (e.g. items of a string array): there is no overhead row
  // to host the error indicator, so it is shown inside the box instead.
  const title = props.label ?? props.schema.title;
  const hasOverhead = !!(title || props.description);

  return (
    <div className="p-1">
      {hasOverhead && (
        <OverheadLabelWithMarkdownDescr
          title={title}
          required={props.required || false}
          description={props.description}
          errors={errors}
          path={props.path}
        />
      )}
      <ErrorRing errors={errors}>
        <div className="relative">
          <TextInput
            onChange={onChange}
            data={data}
            enabled={props.enabled}
            defaultv={props.schema.default}
            placeholder={props.uischema.options?.initial}
            placeholderEditable={props.uischema.options?.initial_editable}
          />
          {!hasOverhead && errors ? (
            <span className="absolute top-1/2 right-3 z-10 -translate-y-1/2">
              <ErrorButton content={errors} />
            </span>
          ) : null}
        </div>
      </ErrorRing>
    </div>
  );
};

export const TextControlTester: RankedTester = rankWith(
  21,
  or(isStringControl, isUntypedStringInput),
);
export default withJsonFormsControlProps(TextControl);
