import { ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useCallback, useEffect } from 'react';
import {
  deregisterDebouncedCommit,
  trackedDebounce,
  registerDebouncedCommit,
} from '../../controller/local/EditController/debounceRegistry';
import ErrorButton from '../../view/components/Buttons/ErrorButton';
import ErrorRing from '../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../view/thirdparty/components/ifc/TextInput/TextInput';
import { isUntypedStringInput } from '../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';
import { doStringTroubleShootCheck } from '../utils/troubleshootChecks';

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
  const sendTrivial = props.uischema.options?.renderer_options?.send_trivial ?? false;

  // Troubleshooting checks update another component's state (the notification
  // dropdown), so they must run after render, not during it.
  useEffect(() => {
    doStringTroubleShootCheck(props);
  });

  const onChange = useCallback(
    trackedDebounce(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        props.handleChange(props.path, sendTrivial ? eventToValue(e) : strictEventToValue(e)),
      1500,
    ),
    [props.path],
  );

  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(onChange);
    return () => deregisterDebouncedCommit(onChange);
  }, [onChange]);

  if (!props.visible) return <></>;

  let data = props.data;
  let errors = props.errors;

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
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
