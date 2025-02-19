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

  const select = (index: number) => {
    const value = options[index].value;
    if (!multiple && selected.findIndex((v) => value == v) != -1) {
      remove(index);
      return;
    }
    const newS = [...selected, value];
    setSelected(newS);
    handleChange(path, newS);
  };

  const remove = (index: number) => {
    const selectedIndex = index; //selected.indexOf(options[index].value);

    if (selectedIndex !== -1) {
      const newS = selected.filter((_, idx) => idx !== selectedIndex);
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
      className="relative p-1"
      onClick={() =>
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10)
      }
    >
      <div className="z-40">
        <select className="hidden" id={id}>
          {options.map(({ value, label: text }) => (
            <option value={value}>{text}</option>
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
                  className={`relative mb-2 flex rounded border  py-2 pl-3 pr-3 outline-none transition  dark:bg-form-input ${
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
                            idx={idx}
                            value={value.toString()}
                            removeCallback={remove}
                            indicateError={true}
                          />
                        );

                      return (
                        <ListItem
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
                            select(
                              options.findIndex(({ label }) => filterResults[0].label === label),
                            );
                            setNewInput('');
                            if (inputRef.current != null) inputRef.current.value = '';
                          }
                        }
                      }}
                      placeHolder={
                        selected.length == 0
                          ? `Type or Select (${data == undefined ? 'undefined' : 'empty list'})`
                          : 'Type...'
                      }
                    />
                  </div>
                  <DeleteButton
                    removeCallback={() => {
                      setSelected([]);
                      handleChange(path, []);
                    }}
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
                          onClick={() => select(index)}
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
                                  const numOcc = selected.reduce(
                                    (count, x) => (x === option.value ? count + 1 : count),
                                    0,
                                  ) as number;
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
