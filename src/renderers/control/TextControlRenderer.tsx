import React from 'react';
import {
  ControlProps,
  isStringControl,
  or,
  RankedTester,
  rankWith,
  resolveSchema,
  schemaTypeIs,
  TesterContext,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useDebouncedChange } from '@jsonforms/material-renderers';
import TextInput from '../../view/thirdparty-based-components/ifc/TextInput/TextInput';
import { tsAddWarningMessage } from '../../controller/global/TroubleShootController';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/EditorState';
// import { MuiInputText } from '../mui-controls/MuiInputText';
// import { MaterialInputControl } from './MaterialInputControl';

const eventToValue = (ev: any) => (ev.target.value === '' ? undefined : ev.target.value);

export const TextControl = (props: ControlProps) => {
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
  const [_, onChange, onClear] = useDebouncedChange(
    props.handleChange,
    '',
    props.data,
    props.path,
    eventToValue,
    1500,
  );

  return (
    <div className="p-1">
      <TextInput {...props} onChange={onChange} onClear={onClear} />
    </div>
  );
};

export const TextControlTester: RankedTester = rankWith(
  21,
  or(isStringControl, (uischema, schema, context: TesterContext) => {
    if ((uischema as any).scope == undefined) return false;
    const subschema = resolveSchema(schema, (uischema as any).scope, context?.rootSchema);

    return subschema.type === undefined && subschema.pattern != undefined;
  }),
);
export default withJsonFormsControlProps(TextControl);
