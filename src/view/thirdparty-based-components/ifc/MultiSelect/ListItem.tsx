import { useRef, useState } from 'react';
import useOutsideClick from '../../../hooks/useOutsideClick';

const ListItem = ({
  idx,
  value,
  removeCallback,

  editable,
  changeCallback,
  onStartEditing,
}: {
  idx: number;
  value: string;
  removeCallback: (idx: number) => void;

  editable?: boolean;
  changeCallback?: (idx: number, value: string) => void;
  onStartEditing?: () => void;
}) => {
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const boxRef = useRef<HTMLInputElement>(null);
  changeCallback = changeCallback ?? (() => {});
  onStartEditing = onStartEditing ?? (() => {});

  const update = (value: undefined | string) => {
    if (value == undefined || value === '') {
      removeCallback(idx);
    } else {
      changeCallback(idx, value);
    }
  };

  useOutsideClick(boxRef, () => {
    setShowEdit(false);
    const value = boxRef.current?.value;
    update(value);
  });

  return (
    <>
      <div
        key={idx}
        className={
          ' max-w-[calc(max(100vw_-_180px,_280px))] sm:max-w-[calc(100vw_-_220px)] lg:max-w-[calc(100vw_-_520px)] ' +
          ' my-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray px-2.5 py-1.5 text-sm font-medium dark:border-strokedark dark:bg-white/30'
        }
      >
        <div
          className="max-w-full flex-initial truncate cursor-pointer"
          onClick={() => {
            if (!editable) return;
            onStartEditing();
            setShowEdit(true);
            setTimeout(() => {
              boxRef.current?.focus();
            }, 20);
          }}
        >
          {showEdit ? (
            <input
              ref={boxRef}
              type="text"
              className="bg-transparent"
              defaultValue={value}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowEdit(false);
                  const value = e.currentTarget.value;
                  update(value);
                }
              }}
            />
          ) : (
            value
          )}
        </div>
        <div className="flex flex-auto flex-row-reverse ml-2">
          <div
            onClick={() => removeCallback(idx)}
            className="cursor-pointer pl-2 hover:text-danger"
          >
            <svg
              className="fill-current"
              role="button"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListItem;
