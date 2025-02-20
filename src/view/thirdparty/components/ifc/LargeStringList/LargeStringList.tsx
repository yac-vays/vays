import { debounce } from 'lodash';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { setIsCurrentlyEditingString } from '../../../../../controller/local/EditController/StandardMode/access';
import useOutsideClick from '../../../../hooks/useOutsideClick';
import DeleteButton from '../MultiSelect/DeleteButton';
import DropdownButton from '../MultiSelect/DropdownButton';
import InlineTextField from '../MultiSelect/InlineTextField';
import ListItem from '../MultiSelect/ListItem';

interface LargeStringProps {
  handleChange: (path: string, value: string[]) => void;
  id: string;
  path: string;
  data?: string[];
  disabled?: boolean;
}

const LargeStringList: React.FC<LargeStringProps> = ({
  id,
  handleChange,
  path,
  data,
  disabled,
}) => {
  const [selected, setSelected] = useState<string[]>(data ?? []);
  const [show, setShow] = useState(false);
  const [isItemEditing, setIsItemEditing] = useState<boolean>(false);
  const trigger = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [newInput, setNewInput] = useState<string>('');
  useOutsideClick(trigger, () => setShow(false));

  /**
   * We need to debounce here to avoid presenting an easy way to spam the server.
   */
  const debouncedHandleChange = useCallback(
    debounce((newS: string[]) => handleChange(path, newS), 800),
    [path],
  );

  /**
   * caching fix
   */
  useEffect(() => {
    setSelected(data ?? []);
  }, [id]);

  const open = () => {
    setShow(true);
  };

  const isOpen = () => {
    return show === true;
  };

  const enterValue = (value: string) => {
    const newS = [...selected, value];
    setSelected(newS);
    debouncedHandleChange(newS);
  };

  const changeValue = (idx: number, value: string) => {
    if (idx >= selected.length) return;
    const newS = [...selected];
    newS[idx] = value;
    setSelected(newS);
    handleChange(path, newS);
    // UX decision: Do debounce when editing...? No because enter...
    //debouncedHandleChange(newS);
  };

  const remove = (index: number) => {
    const newS = selected.filter((_, idx) => idx !== index);
    setSelected(newS);
    handleChange(path, newS);
  };

  return (
    <div
      className="relative z-20 p-1 pb-0"
      onClick={() =>
        setTimeout(() => {
          if (!isItemEditing) inputRef.current?.focus();
        }, 10)
      }
    >
      <div className="z-20">
        <div className="flex flex-col items-center">
          <div className="relative z-20 inline-block w-full">
            <div className="relative flex flex-col items-center">
              <div ref={trigger} onClick={open} className="w-full">
                <div
                  className={`mb-2 flex rounded border  py-2 pl-3 pr-3 outline-none transition  dark:bg-form-input ${
                    isOpen()
                      ? 'border-primary border-primary'
                      : 'border-stroke dark:border-form-strokedark'
                  }`}
                >
                  <div
                    className={`flex flex-auto flex-wrap gap-3 overflow-hidden ${
                      isOpen() ? '' : 'max-h-[120px]'
                    }`}
                  >
                    {selected.map((value, idx) => {
                      return (
                        <ListItem
                          editable
                          idx={idx}
                          value={value}
                          removeCallback={remove}
                          changeCallback={(idx: number, v: string) => {
                            setIsItemEditing(false);
                            changeValue(idx, v);
                          }}
                          onStartEditing={() => setIsItemEditing(true)}
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
                        setIsCurrentlyEditingString(true);
                        if (event.key === 'Enter' && newInput !== '') {
                          enterValue(newInput);
                          setNewInput('');
                          if (inputRef.current != null) inputRef.current.value = '';
                        }
                      }}
                      placeHolder={'Type...'}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LargeStringList;
