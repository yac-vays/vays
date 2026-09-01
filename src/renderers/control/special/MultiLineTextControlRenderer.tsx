import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useCallback, useEffect } from 'react';
import {
  deregisterDebouncedCommit,
  trackedDebounce,
  registerDebouncedCommit,
} from '../../../controller/local/EditController/debounceRegistry';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextArea from '../../../view/thirdparty/components/ifc/TextArea/TextAreaInput';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';
import { doStringTroubleShootCheck } from '../../utils/troubleshootChecks';

const eventToValue = (ev: React.ChangeEvent<HTMLTextAreaElement>) => ev.target.value;

export const MultiLineTextControlRenderer = (props: ControlProps) => {
  // Troubleshooting checks update another component's state (the notification
  // dropdown), so they must run after render, not during it.
  useEffect(() => {
    doStringTroubleShootCheck(props);
  });

  let data = props.data;
  let errors = props.errors;

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  const onChange = useCallback(
    trackedDebounce(
      (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        props.handleChange(props.path, eventToValue(e)),
      1500,
    ),
    [props.path],
  );

  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(onChange);
    return () => deregisterDebouncedCommit(onChange);
  }, [onChange]);

  return (
    <div className="p-1">
      <OverheadLabel
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={errors}
        path={props.path}
      />
      <ErrorRing errors={errors}>
        <TextArea
          onChange={onChange}
          data={data}
          rows={props.uischema.options?.renderer_options?.rows}
          enabled={props.enabled}
          defaultv={props.schema.default}
          placeholder={props.uischema.options?.initial}
          placeholderEditable={props.uischema.options?.initial_editable}
        />
      </ErrorRing>
    </div>
  );
};

export const MultiLineTextControlTester: RankedTester = rankWith(
  30,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('text_area')),
);

export default withJsonFormsControlProps(MultiLineTextControlRenderer);
