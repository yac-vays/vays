import React, { useState } from 'react';
import OverheadLabel from '../Label/OverheadLabel';
import ErrorBox from '../Label/ErrorBox';
import _ from 'lodash';

type DropDownOptions = { label: string; value: string }[];

interface DropdownProps {
  // Expects the first one to be the title, the second one the label.
  options: DropDownOptions;
  title?: string;
  onChange: (value: string) => void;
  initValue?: string;
  description?: string;
  required?: boolean;
  errors?: string;
}

function isValidOption(optValue: string | undefined, options: DropDownOptions) {
  for (const opt of options) {
    if (_.isEqual(optValue, opt.value)) {
      return true;
    }
  }
  return false;
}

const SelectStatic: React.FC<DropdownProps> = ({
  options,
  title,
  onChange,
  initValue,
  required,
  description,
  errors,
}: DropdownProps) => {
  if (!isValidOption(initValue, options)) {
    initValue = undefined;
  }
  const [selectedOption, setSelectedOption] = useState<string>(initValue || '');
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(initValue != undefined);
  let displayError = '';
  if (errors !== undefined && errors.length != 0) displayError = 'Error: ' + errors;

  const changeTextColor = () => {
    setIsOptionSelected(true);
  };

  return (
    <div className="mb-4.5">
      <OverheadLabel title={title} required={required || false} description={description} />

      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={selectedOption}
          onChange={(e) => {
            /*********************
             * String vs Number problem:
             *
             * In the select element, note that a number value seems to be converted into a string
             * when requesting the value.
             *
             * https://stackoverflow.com/questions/36531525/value-of-selectoption-coming-back-as-string
             * https://stackoverflow.com/questions/44460102/form-input-select-returned-as-number-not-string-with-javascript
             */
            onChange(options[e.target.selectedIndex - 1].value);
            setSelectedOption(e.target.value);
            changeTextColor();
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
            isOptionSelected ? 'text-black dark:text-white' : ''
          }`}
        >
          <option value="" disabled className="text-body dark:text-bodydark">
            Select option...
          </option>
          {(function enterOptions() {
            let jsx = [];
            for (let item of options) {
              jsx.push(
                <option value={item.value} className="text-body dark:text-bodydark">
                  {item.label}
                </option>,
              );
            }

            return jsx;
          })()}
        </select>

        <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.8">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill=""
              ></path>
            </g>
          </svg>
        </span>
      </div>
      <ErrorBox displayError={displayError} />
    </div>
  );
};

export default SelectStatic;
