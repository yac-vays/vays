import { useEffect, useRef } from 'react';
import { setIsCurrentlyEditingString } from '../../../../controller/local/EditController/StandardMode/access';

interface InputProps {
  data?: string;
  placeholder?: string;
  placeholderEditable?: boolean;
  enabled: boolean;
  defaultv?: string;
  password?: boolean;
  onChange: React.ChangeEventHandler<Element>;
}

const TextInput = ({
  data,
  enabled,
  defaultv,
  placeholder,
  placeholderEditable,
  password,
  onChange,
}: InputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  let inp = defaultv;
  if (placeholderEditable && !password) {
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
   * caching fix
   */
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = defValue;
  }, [defValue]);

  return (
    <>
      <div>
        <input
          ref={inputRef}
          type={password ? 'password' : 'text'}
          disabled={!enabled}
          defaultValue={defValue}
          className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-primary  dark:bg-meta-4 dark:focus:border-primary"
          placeholder={ph}
          onChange={(e) => {
            setIsCurrentlyEditingString(true);
            onChange(e);
          }}
        />
      </div>
    </>
  );
};

export default TextInput;
