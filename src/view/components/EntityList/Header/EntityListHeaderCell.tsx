import { DetailedHTMLProps, InputHTMLAttributes, useRef, useState } from 'react';
import useOutsideClick from '../../../hooks/useOutsideClick';

export const MINWIDTH_COLUMN = 100; // px

interface ELHeaderCellProps {
  title: string;
  firstField: boolean;
  searchable: boolean;
  searchCallback: undefined | ((a: string) => void);
}

/**
 * A header cell in the entity list.
 * TODO: Use pseudocls
 * @param title the title of the row
 * @param firstField boolean, whether the header is in the first column
 * @returns
 */
const EntityListHeaderCell = ({
  title,
  firstField,
  searchable,
  searchCallback,
}: ELHeaderCellProps) => {
  const [openSearch, setOpenSearch] = useState(false);
  const headerEntryRef = useRef<HTMLTableCellElement>(null);
  const inputBar = useRef<HTMLInputElement>(null);

  const toggleOpenSearch = () => {
    if (searchable) {
      setOpenSearch(true);
      setTimeout(() => {
        inputBar.current?.focus();
      }, 10);
    }
  };

  useOutsideClick(headerEntryRef, () => {
    if (inputBar.current != null && (inputBar.current as HTMLInputElement).value === '') {
      setOpenSearch(false);
    }
  });

  const onButtonDownCallback = (
    event: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  ) => {
    if ((event as KeyboardEvent).code === 'Escape' && inputBar.current != null) {
      inputBar.current.value = '';
      setOpenSearch(false);
      if (inputBar.current != null && searchCallback != undefined) {
        searchCallback('');
      }
    }
  };

  const onInput = () => {
    if (inputBar.current != null && searchCallback != undefined) {
      searchCallback(inputBar.current?.value);
    }
  };

  return (
    <>
      <th
        ref={headerEntryRef}
        colSpan={1}
        onClick={toggleOpenSearch}
        role="columnheader"
        title="Toggle Search"
        className="py-0 pr-20"
        // display: "flex", justifyContent: "center", alignItems: "center",
        style={
          firstField
            ? { cursor: 'pointer', marginRight: 10, minWidth: MINWIDTH_COLUMN }
            : { paddingLeft: 0, cursor: 'pointer', minWidth: MINWIDTH_COLUMN }
        }
      >
        <div className={`flex items-center ${openSearch ? 'hidden' : 'block'}`}>
          <span className=" py-1 text-plainfont grow text-left"> {title}</span>
          {/* TODO:_Need to decide whether alphanumerical sorting is a sought for feature. */}
          {searchable ? (
            <div
              className="ml-2 inline-flex flex-col space-y-[2px]"
              style={{ position: 'revert', right: 0 }}
            >
              <svg
                className="fill-current opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
              </svg>
            </div>
          ) : (
            <></>
          )}
        </div>

        {/* TODO: Get a more elegant solution than plain subtraction for the problem
          where the appearance of the input bar significantly reshapes the table columns. */}
        <div className={`flex items-left ${openSearch ? 'block' : 'hidden'}`}>
          <input
            onInput={onInput}
            onKeyDown={onButtonDownCallback}
            ref={inputBar}
            type="text"
            className=" rounded-md border border-stroke px-3 py-1 outline-none focus:border-primary "
            style={{
              //@ts-expect-error Ignore init
              maxWidth: headerEntryRef.current?.clientWidth - 30 - (firstField ? 30 : 0),
              left: 0,
            }}
          />
        </div>
      </th>
    </>
  );
};

export default EntityListHeaderCell;
