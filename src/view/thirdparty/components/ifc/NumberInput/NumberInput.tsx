import React, { useEffect, useRef } from 'react';

interface NumberProps {
  id: string;
  data?: number | string;
  defaultv?: number | string;
  placeholder?: number | string;
  placeholderEditable?: boolean;
  /** HTML `step`: what the up/down arrows add (the browser default is 1). */
  step?: number;
  enabled: boolean;
  onChange: React.ChangeEventHandler<Element>;
  /** Shows a small × in the box that removes the value (unset it), if given. */
  onReset?: () => void;
  /** Hide the browser's up/down buttons (the arrow keys still step). */
  hideSpinner?: boolean;
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
  step,
  enabled,
  onChange,
  onReset,
  hideSpinner,
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
    <div id={id} className="relative">
      <input
        ref={inputRef}
        type="number"
        step={step}
        disabled={!enabled}
        defaultValue={defValue}
        className={`w-full rounded-md border border-stroke bg-transparent py-2.5 pl-5 outline-hidden focus:border-primary  dark:bg-meta-4 dark:focus:border-primary ${
          onReset ? (hideSpinner ? 'pr-9' : 'pr-12') : 'pr-5'
        } ${
          hideSpinner
            ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            : ''
        }`}
        placeholder={ph.toString()}
        onChange={onChange}
      />
      {onReset && (
        <button
          type="button"
          aria-label="Reset to default"
          title="Reset to default"
          className={`absolute top-1/2 ${hideSpinner ? 'right-3' : 'right-8'} flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-reducedfont hover:bg-stroke hover:text-plainfont focus:outline-hidden focus:ring-2 focus:ring-primary`}
          onClick={onReset}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default React.memo(NumberInput);
