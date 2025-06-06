import { useEffect, useState } from 'react';
import InformationButton from '../../../../components/Buttons/InformationButton';

const Checkbox = ({
  title,
  initValue,
  onChange,
  minified,
  description,
  disabled,
  isMarkdownDesc = false,
}: {
  title?: string;
  initValue: boolean;
  onChange(value: boolean): void;
  minified?: boolean;
  description?: string;
  disabled: boolean;
  isMarkdownDesc: boolean;
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(initValue);

  const callback = (
    e:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.MouseEvent<HTMLLabelElement, MouseEvent>,
  ) => {
    if (disabled) return;
    e.preventDefault();
    // Note that the setter function is asynchronous! Thus precompute value first.
    const value = !isChecked;
    setIsChecked(value);
    e.currentTarget.blur();
    onChange(value);
  };

  // Required due to json-forms side caching (memo).
  useEffect(() => {
    setIsChecked(initValue);
  }, [initValue]);
  return (
    <div>
      <label className="flex relative select-none items-center">
        <div id="checkbox" className="relative">
          <input type="checkbox" className="sr-only" />
          <div
            className={`flex  h-5 w-5 items-center justify-center rounded border cursor-pointer  ${
              isChecked && 'border-primary dark:border-white bg-primary-10 dark:bg-transparent'
            }`}
            onClick={callback}
          >
            <span
              className={`text-[#3056D3] dark:text-white opacity-0 ${isChecked && '!opacity-100'}`}
            >
              <svg
                width="11"
                height="8"
                viewBox="0 0 11 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="fill-current"
                  d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                  fill="#none"
                  stroke="#none"
                  strokeWidth="0.4"
                ></path>
              </svg>
            </span>
          </div>
        </div>
        <label
          className={`mx-${minified ? '1' : '4'} block text-plainfont flex flex-row cursor-pointer`}
          onClick={callback}
        >
          {title}
        </label>
        {description && description !== '' ? (
          <InformationButton title={title} description={description} isMarkdown={isMarkdownDesc} />
        ) : (
          <></>
        )}
      </label>
    </div>
  );
};

export default Checkbox;
