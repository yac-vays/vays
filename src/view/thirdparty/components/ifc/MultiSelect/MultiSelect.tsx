import React, { useEffect, useRef, useState } from 'react';
import DeleteButton from './DeleteButton';
import DropdownButton from './DropdownButton';
import InlineTextField from './InlineTextField';
import ListItem from './ListItem';

interface Option {
  value: number | string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  handleChange: (path: string, value: (number | string)[]) => void;
  id: string;
  multiple?: boolean;
  path: string;
  data?: (number | string)[];
  disabled?: boolean;
}

function filterOptions(options: Option[], searchTerm: string) {
  if (searchTerm === '') return options;
  return options.filter(({ label }) => label.includes(searchTerm));
}

const MultiSelect: React.FC<DropdownProps> = ({
  id,
  multiple,
  options,
  handleChange,
  path,
  data,
  disabled,
}) => {
  options = options ?? [];
  const optionsValues = options.map(({ value }) => value);
  const [selected, setSelected] = useState<(number | string)[]>(data ?? []);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [newInput, setNewInput] = useState<string>('');

  /**
   * caching fix
   */
  useEffect(() => {
    setSelected(data ?? []);
  }, [data]);

  const open = () => {
    setShow(true);
  };

  const isOpen = () => {
    return show === true;
  };

  const select = (option: Option) => {
    if (disabled) return;
    const value = option.value;
    const selectedIndex = selected.findIndex((v) => value == v);
    if (!multiple && selectedIndex != -1) {
      remove(selectedIndex);
      return;
    }
    const newS = [...selected, value];
    setSelected(newS);
    handleChange(path, newS);
  };

  /** Removes an entry from `selected` (`index` is an index into `selected`). */
  const remove = (index: number) => {
    if (disabled) return;
    if (index !== -1) {
      const newS = selected.filter((_, idx) => idx !== index);
      setSelected(newS);
      handleChange(path, newS);
    }
  };

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdownRef.current) return;
      //@ts-expect-error ignore the type warnings.
      if (!show || dropdownRef.current.contains(target) || trigger.current.contains(target)) return;
      setShow(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  return (
    <div
      className="relative"
      onClick={() =>
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10)
      }
    >
      <div className="z-40">
        <select className="hidden" id={id}>
          {options.map(({ value, label: text }, idx) => (
            <option key={idx} value={value}>
              {text}
            </option>
          ))}
        </select>

        <div className="flex flex-col items-center">
          <div className="relative inline-block w-full">
            <div className="relative flex flex-col items-center">
              <div
                ref={trigger}
                onClick={open}
                className={`relative w-full z-0 ${data == undefined ? 'opacity-50' : ''}`}
              >
                <div
                  id="inputfieldSelect"
                  className={`relative flex rounded border  py-2 pl-3 pr-3 outline-none transition  dark:bg-form-input ${
                    isOpen()
                      ? 'border-primary border-primary'
                      : 'border-stroke dark:border-form-strokedark'
                  }`}
                >
                  <div className="flex flex-auto flex-wrap gap-3 z-10">
                    {selected.map((value, idx) => {
                      const valueIndex = optionsValues.indexOf(value);
                      if (valueIndex == -1)
                        return (
                          <ListItem
                            key={idx}
                            idx={idx}
                            value={value.toString()}
                            removeCallback={remove}
                            indicateError={true}
                          />
                        );

                      return (
                        <ListItem
                          key={idx}
                          idx={idx}
                          value={options[valueIndex].label}
                          removeCallback={remove}
                        />
                      );
                    })}

                    <InlineTextField
                      numItemsInList={selected.length}
                      inputRef={inputRef}
                      currentInput={newInput}
                      onChange={(event) => {
                        setNewInput(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Tab') {
                          const filterResults = filterOptions(options, event.currentTarget.value);
                          if (filterResults.length == 1) {
                            select(filterResults[0]);
                            setNewInput('');
                            if (inputRef.current != null) inputRef.current.value = '';
                          }
                        }
                      }}
                      placeHolder={
                        selected.length == 0
                          ? `Type or Select (${data == undefined ? 'undefined' : 'empty list'})`
                          : ''
                      }
                      disabled={disabled}
                    />
                  </div>
                  <DeleteButton
                    removeCallback={() => {
                      if (disabled) return;
                      setSelected([]);
                      handleChange(path, []);
                    }}
                    disabled={disabled}
                  />
                  <DropdownButton open={open} showExpand={show} />
                </div>
              </div>
              <div
                id="dropdown-multiselect"
                className="relative w-full px-4 overflow-visible border-black flex z-40 drop-shadow-xl"
              >
                <div
                  className={`max-h-select absolute top-full left-0 z-40 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input ${
                    isOpen() ? '' : 'hidden'
                  }`}
                  ref={dropdownRef}
                  onFocus={() => setShow(true)}
                  onBlur={() => setShow(false)}
                >
                  <div className="relative flex w-full flex-col z-50 max-h-50">
                    {filterOptions(options, newInput).map((option, index) => (
                      <div key={index}>
                        <div
                          className="w-full cursor-pointer rounded-t border-b border-stroke hover:bg-primary-5 dark:border-form-strokedark"
                          onClick={() => select(option)}
                        >
                          <div
                            className={`relative flex w-full items-center border-l-[3px]  p-2 pl-2 ${
                              selected.findIndex((v) => v === option.value) != -1
                                ? 'border-primary'
                                : 'border-transparent'
                            }`}
                          >
                            <div className="flex w-full items-center">
                              <div className="mx-2 leading-6 select-none">
                                {option.label}
                                {(function () {
                                  const numOcc = selected.filter((x) => x === option.value).length;
                                  if (numOcc <= 1) return <></>;

                                  return (
                                    <em className="r-0 ml-2 opacity-50">{numOcc} occurences</em>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
