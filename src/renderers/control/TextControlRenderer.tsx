import { ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { debounce } from 'lodash';
import { useCallback, useEffect } from 'react';
import {
  deregisterDebouncedCommit,
  registerDebouncedCommit,
} from '../../controller/local/EditController/debounceRegistry';
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
    debounce(
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

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={errors}
      />
      <ErrorRing errors={errors}>
        <TextInput
          onChange={onChange}
          data={data}
          enabled={props.enabled}
          defaultv={props.schema.default}
          placeholder={props.uischema.options?.initial}
          placeholderEditable={props.uischema.options?.initial_editable}
        />
      </ErrorRing>
    </div>
  );
};

export const TextControlTester: RankedTester = rankWith(
  21,
  or(isStringControl, isUntypedStringInput),
);
export default withJsonFormsControlProps(TextControl);
