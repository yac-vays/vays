import React from 'react';

interface NumberProps {
  id: string;
  data?: number | string;
  defaultv?: number | string;
  placeholder?: number | string;
  placeholderEditable?: boolean;
  enabled: boolean;
  onChange: React.ChangeEventHandler<Element>;
}

/**
 * This currently handles both numbers and floating points.
 * @param props
 * @returns
 */
const NumberInput = ({
  id,
  data,
  defaultv,
  placeholder,
  placeholderEditable,
  enabled,
  onChange,
}: NumberProps) => {
  let inp = defaultv;
  if (placeholderEditable) {
    inp = placeholder ?? '';
  }
  if (data != undefined) inp = data;

  let ph: string | number = 'Type...';
  if (!placeholderEditable) {
    ph = placeholder ?? ph;
  }

  return (
    <div id={id}>
      <input
        type="number"
        disabled={!enabled}
        defaultValue={inp}
        className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 mb-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        placeholder={ph.toString()}
        onChange={onChange}
      />
    </div>
  );
};

export default React.memo(NumberInput);
