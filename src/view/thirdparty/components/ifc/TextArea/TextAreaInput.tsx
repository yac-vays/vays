import { useEffect, useRef } from 'react';
import { setIsCurrentlyEditingString } from '../../../../../controller/local/EditController/StandardMode/access';

interface TextAreaProps {
  data?: string;
  placeholder?: string;
  placeholderEditable?: boolean;
  enabled: boolean;
  defaultv?: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  rows?: number;
}

const TextAreaInput = ({
  data,
  enabled,
  defaultv,
  placeholder,
  placeholderEditable,
  rows = 6,
  onChange,
}: TextAreaProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  let inp = defaultv;
  if (placeholderEditable) {
    inp = placeholder ?? '';
  }
  if (data != undefined) inp = data;
  let defValue = '';
  if (inp != undefined) defValue = inp.toString();

  let ph = 'Type...';
  if (!placeholderEditable) {
    ph = placeholder ?? ph;
  }

  /**
   * Fix caching issues to ensure correct rendering
   */
  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.value = defValue;
  }, [defValue]);

  return (
    <>
      <div>
        <textarea
          ref={textAreaRef}
          disabled={!enabled}
          defaultValue={defValue}
          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-plainfont outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          placeholder={ph}
          rows={rows}
          onChange={(e) => {
            setIsCurrentlyEditingString(true);
            onChange(e);
          }}
        />
      </div>
    </>
  );
};

export default TextAreaInput;
