import React, { useEffect, useRef } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  let inp = defaultv;
  if (placeholderEditable) {
    inp = placeholder ?? '';
  }
  if (data != undefined) inp = data;
  const defValue = inp == undefined ? '' : inp.toString();

  let ph: string | number = '';
  if (!placeholderEditable) {
    ph = placeholder ?? ph;
  }

  // Keep the (uncontrolled) input in sync when the value changes externally —
  // e.g. when the YAML editor updates the form data. Without this the input
  // keeps its initial `defaultValue` and ignores later prop changes. Mirrors
  // TextInput's "caching fix". Guarded so it never disrupts the user's own
  // typing: while the input has focus, a (possibly stale) async response must
  // not clobber in-progress edits.
  useEffect(() => {
    if (!inputRef.current) return;
    if (document.activeElement === inputRef.current) return;
    if (inputRef.current.value !== defValue) {
      inputRef.current.value = defValue;
    }
  }, [defValue]);

  return (
    <div id={id}>
      <input
        ref={inputRef}
        type="number"
        disabled={!enabled}
        defaultValue={defValue}
        className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 mb-2 outline-none focus:border-primary  dark:bg-meta-4 dark:focus:border-primary"
        placeholder={ph.toString()}
        onChange={onChange}
      />
    </div>
  );
};

export default React.memo(NumberInput);
