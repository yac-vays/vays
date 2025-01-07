import { ControlProps } from '@jsonforms/core';
import OverheadLabel from '../Label/OverheadLabel';
import ErrorBox from '../Label/ErrorBox';
import React from 'react';

interface MutableInput {
  onChange: React.ChangeEventHandler<Element>;
  onClear: () => void;
}

/**
 * This currently handles both numbers and floating points.
 * @param props
 * @returns
 */
const NumberInput = (props: ControlProps & MutableInput) => {
  // Do not use handleChange, this is the version that is not debounced.
  const { id, description, enabled, data, schema, uischema, errors, visible, required, onChange } =
    props;

  let displayError = '';
  let inp = schema.default;
  if (uischema.options?.initial_editable) {
    inp = uischema.options?.initial ?? '';
  }
  if (data != undefined) inp = data;

  if (errors.length != 0) displayError = 'Error: ' + errors;
  let placeholder = 'Type...';
  if (!uischema.options?.initial_editable) {
    placeholder = uischema.options?.initial ?? placeholder;
  }

  if (!visible) return <></>;

  return (
    <>
      <div id={id}>
        <OverheadLabel
          title={schema.title}
          required={required || false}
          description={description}
        />

        <input
          type="number"
          disabled={!enabled}
          defaultValue={inp}
          className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 mb-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          placeholder={placeholder}
          onChange={onChange}
        />
        <ErrorBox displayError={displayError} />
      </div>
    </>
  );
};

export default React.memo(NumberInput);
