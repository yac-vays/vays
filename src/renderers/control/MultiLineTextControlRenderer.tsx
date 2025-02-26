import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import { tsAddWarningMessage } from '../../controller/global/troubleshoot';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/access';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextArea from '../../view/thirdparty/components/ifc/TextArea/TextAreaInput';
import { isCustomRenderer, isUntypedStringInput } from '../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

const eventToValue = (ev: React.ChangeEvent<HTMLTextAreaElement>) => ev.target.value;

export const MultiLineTextControl = (props: ControlProps) => {
  doTroubleShootCheck(props);

  let data = props.data;
  let errors = props.errors;

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  const onChange = useCallback(
    debounce(
      (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        props.handleChange(props.path, eventToValue(e)),
      1500,
    ),
    [props.path],
  );

  return (
    <div className="p-1">
      <OverheadLabel
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
      />
      <TextArea
        onChange={onChange}
        data={data}
        rows={props.uischema.options?.rows}
        enabled={props.enabled}
        defaultv={props.schema.default}
        placeholder={props.uischema.options?.initial}
        placeholderEditable={props.uischema.options?.initial_editable}
      />
      <ErrorBox displayError={errors} />
    </div>
  );
};

function doTroubleShootCheck(props: ControlProps) {
  if (props.label.toLowerCase().includes('password')) {
    tsAddWarningMessage(
      9,
      'Potentially unsafe handling of Passwords',
      'It seems that you are showing and storing a password in plaintext. Consider using the dedicated Password renderer. ' +
        'It does not show the password and stores only the hash. If you still want to store the password in plain text or in another format, please contact me. ',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  if (props.label.toLowerCase().includes('date') || props.label.toLowerCase().includes('due')) {
    tsAddWarningMessage(
      3,
      'Potentially handling a Date as a String',
      'It seems that you are requiring a date. In this case, you may choose to set the parameter "format" to one of ' +
        '"date", "time" or "datetime". Currently, the first two are not yet supported (but will soon).',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  if (props.schema.default && typeof props.schema.default !== 'string') {
    tsAddWarningMessage(
      5,
      'Potentially incorrect type for default value',
      'Looks like the default value has a type that the schema does not allow.',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  if (
    props.uischema.options?.rows !== undefined &&
    !Number.isInteger(props.uischema.options.rows)
  ) {
    tsAddWarningMessage(
      5,
      'Potentially incorrect type for rows option',
      'Looks like the rows option has a type that the schema does not allow.',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
  if (
    props.uischema?.options?.initial &&
    props.schema.default != undefined &&
    props.uischema?.options?.initial_editable
  ) {
    tsAddWarningMessage(
      2,
      'Potentially overshadowing editable default',
      'It looks like the schema both specifies that the key has a default and in the vays_options, there is an editable. ' +
        'default value (whose default value will not be written into the YAML). If this is the case, the latter is ignored',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }

  if (typeof props.data === 'string' && props.data.includes(', ')) {
    tsAddWarningMessage(
      6,
      'Potentially having a list as string',
      'It looks like there are inputs which are enumerations, seperated by commas. If this is the case please check out ' +
        'the custom renderer list_as_string. This improves the user experience significantly.',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }

  if (!props.description) {
    tsAddWarningMessage(
      1,
      'No description available',
      'It looks like this key does not have a description. Providing one may improve user experience.',
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }
}

export const MultiLineTextControlTester: RankedTester = rankWith(
  30,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('text_area')),
);

export default withJsonFormsControlProps(MultiLineTextControl);
