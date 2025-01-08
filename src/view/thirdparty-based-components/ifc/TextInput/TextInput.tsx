import { ControlProps } from '@jsonforms/core';
import OverheadLabel from '../Label/OverheadLabel';
import ErrorBox from '../Label/ErrorBox';
import { setIsCurrentlyEditingString } from '../../../../controller/local/EditController/StandardMode/StandardState';
import { useEffect, useRef } from 'react';

interface MutableInput {
  password?: boolean;
  onChange: React.ChangeEventHandler<Element>;
}

const TextInput = (props: ControlProps & MutableInput) => {
  // Do not use handleChange, this is the version that is not debounced.
  const {
    id,
    description,
    enabled,
    data,
    schema,
    errors,
    //label,
    uischema,
    visible,
    required,
    onChange,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  let inp = schema.default;
  if (uischema.options?.initial_editable && !props.password) {
    inp = uischema.options?.initial ?? '';
  }
  if (data != undefined) inp = data;
  let defValue = '';
  if (inp != undefined) defValue = inp.toString();
  let displayError = '';
  if (errors.length != 0) displayError = 'Error: ' + errors;

  // TODO: Should check for a better solution than inventing a new attribute here... maybe use uischema?
  let placeholder = 'Type...';
  if (!uischema.options?.initial_editable) {
    placeholder = uischema.options?.initial ?? placeholder;
  }

  /**
   * Again, json forms caching necessitates an according update to the element.
   */
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = defValue;
  }, [defValue]);

  return (
    visible && (
      <>
        <div id={id}>
          <OverheadLabel
            title={schema.title}
            required={required || false}
            description={description}
          />

          <input
            ref={inputRef}
            type={props.password ? 'password' : 'text'}
            disabled={!enabled}
            defaultValue={defValue}
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            placeholder={placeholder}
            onChange={(e) => {
              setIsCurrentlyEditingString(true);
              onChange(e);
            }}
          />
          <ErrorBox displayError={displayError} />
        </div>
      </>
    )
  );
};

export default TextInput;
