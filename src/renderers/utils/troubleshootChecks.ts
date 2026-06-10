import { ControlProps } from '@jsonforms/core';
import { tsAddWarningMessage } from '../../controller/global/troubleshoot';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/access';

/**
 * Admin troubleshooting checks shared by the string-input renderers
 * (TextControl, MultiLineTextControl). Must be invoked from an effect, not
 * the render body: `tsAddWarningMessage` updates the DropdownNotification
 * component's state, which React forbids during another component's render.
 */
export function doStringTroubleShootCheck(props: ControlProps) {
  const key = props.path.split('/').pop() ?? 'key';
  const backend = getCurrentContext()?.rc.backendObject?.title ?? 'Unknown';

  if (props.label.toLowerCase().includes('password')) {
    tsAddWarningMessage(
      9,
      'Potentially unsafe handling of Passwords',
      'It seems that you are showing and storing a password in plaintext. Consider using the dedicated Password renderer. ' +
        'It does not show the password and stores only the hash. If you still want to store the password in plain text or in another format, please contact me. ',
      key,
      backend,
    );
  }
  if (props.label.toLowerCase().includes('date') || props.label.toLowerCase().includes('due')) {
    tsAddWarningMessage(
      3,
      'Potentially handling a Date as a String',
      'It seems that you are requiring a date. In this case, you may choose to set the parameter "format" to one of ' +
        '"date", "time" or "datetime". Currently, the first two are not yet supported (but will soon).',
      key,
      backend,
    );
  }
  if (props.schema.default && typeof props.schema.default !== 'string') {
    tsAddWarningMessage(
      5,
      'Potentially incorrect type for default value',
      'Looks like the default value has a type that the schema does not allow.',
      key,
      backend,
    );
  }
  if (
    props.uischema.options?.renderer_options?.rows !== undefined &&
    !Number.isInteger(props.uischema.options.renderer_options.rows)
  ) {
    tsAddWarningMessage(
      5,
      'Potentially incorrect type for rows option',
      'Looks like the rows option has a type that the schema does not allow.',
      key,
      backend,
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
      key,
      backend,
    );
  }

  if (typeof props.data === 'string' && props.data.includes(', ')) {
    tsAddWarningMessage(
      6,
      'Potentially having a list as string',
      'It looks like there are inputs which are enumerations, seperated by commas. If this is the case please check out ' +
        'the custom renderer list_as_string. This improves the user experience significantly.',
      key,
      backend,
    );
  }

  if (!props.description) {
    tsAddWarningMessage(
      1,
      'No description available',
      'It looks like this key does not have a description. Providing one may improve user experience.',
      key,
      backend,
    );
  }
}
