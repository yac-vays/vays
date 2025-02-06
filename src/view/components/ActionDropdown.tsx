import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  positionDropdownElement,
  registerTableScrollContainerEvent,
} from '../../controller/local/Overview/list';
import { hashCode } from '../../utils/hashUtils';
import { GUIActionDropdownArg } from '../../utils/types/internal/actions';
import { Nullable } from '../../utils/types/typeUtils';
import useOutsideClick from '../hooks/useOutsideClick';
import { MINWIDTH_COLUMN } from './EntityList/Header/EntityListHeaderCell';

interface ActionDropdownProps {
  actions: GUIActionDropdownArg[];
  entityName: string;
}

/**
 * Unfortunately, this applies:
 * https://stackoverflow.com/questions/71592906/visible-overflow-on-x-axis-but-auto-scroll-on-axis-y
 * https://www.reddit.com/r/css/comments/1b64a4o/how_to_set_overflow_scroll_on_the_yaxis_and/
 * https://www.w3.org/TR/css3-box/#overflow-x
 *
 * Some common tricks to circumvent this issue are not possible to use.
 * Thus, this element needs some javascript for positioning
 */

/**
 * Assumes that the actions have been filtered previously (permission check) and that
 * the user does have permissions to execute.
 * @param actions the actions to display
 * @param entityName the name of the entity to apply the action to
 * @returns
 *
 * @satisfies ID: The actionable dropdown items have the ID "action-dropdown-" + hashCode(`${entityName}-${act.action.name}-${act.action.description}`).
 */
const ActionDropdown = ({ actions, entityName }: ActionDropdownProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownHeaderRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  const isEmpty = actions.length == 0;
  const dropdownWidth: number = MINWIDTH_COLUMN;
  if (!isEmpty) {
    // TODO: Get more examples and check if this is necessary
    // const maxString: string = (actions.reduce((a, b) =>
    //   a.action.title > b.action.title ? a : b
    // )).action.title;
    // dropdownWidth = Math.min(getWidthOfText(maxString, {}) + 36, 150)
  }

  useOutsideClick(dropdownRef, () => {
    setOpen(false);
  });
  let tick = false;
  useEffect(() => {
    const update = () => {
      positionDropdownElement(dropdownContentRef, dropdownHeaderRef);
      if (tick) {
        window.requestAnimationFrame(update);
        tick = false;
      } else {
        tick = true;
      }
    };
    window.requestAnimationFrame(update);
    registerTableScrollContainerEvent(() => setOpen(false));
  }, []);

  window.addEventListener('resize', () =>
    positionDropdownElement(dropdownContentRef, dropdownHeaderRef),
  );

  return (
    <>
      <div ref={dropdownRef} className="group inline-flex flex-col">
        <div
          ref={dropdownHeaderRef}
          onClick={
            (e) => {
              e.preventDefault();
              positionDropdownElement(dropdownContentRef, dropdownHeaderRef);
              // Disables the dropdown click if isEmpty is true.
              setOpen(!open && !isEmpty);
            }
            // "inline-flex items-center justify-center border border-primary text-center gap-2.5 font-medium text-primary rounded hover:bg-greydark dark:hover:bg-danger
            //     bg-graydark dark:bg-danger">
          }
          // "inline-flex border-y border-stroke py-1 px-2 font-medium text-plainfonthover:border-primary hover:bg-primary hover:text-white dark:text-white dark:hover:border-primary sm:py-3 sm:px-6"
          // text-[#98A6AD] hover:text-reducedfont
          className={
            'inline-flex items-center justify-center border-t border-r border-b text-center gap-2.5 font-medium bg-[#f5f5f5] dark:hover:bg-meta-4 rounded dark:bg-meta-4'
          }
          style={{
            position: 'relative',
            borderColor: 'rgb(0 0 0/0)',
            left: -1,
            zIndex: 1,
            cursor: 'pointer',
          }}
        >
          <div
            className={`group flex relative duration-300 hover:text-plainfont ${
              isEmpty ? 'opacity-40' : 'hover:scale-110'
            }`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div
              className="group relative flex items-center justify-center p-3 border-t border-r border-b rounded-r"
              style={(function () {
                return {
                  borderColor: 'rgb(0 0 0/0)',
                  height: 35,
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  zIndex: 2,
                  minWidth:
                    // TODO: Revisit scaling of the dropdown.
                    dropdownWidth,
                };
              })()}
            >
              <span>Other Actions</span>
              <svg
                className={`right-4 ml-2 -translate-y-1/6 fill-current ${open && 'rotate-180'}`}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                  fill=""
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          ref={dropdownContentRef}
          className={`shadow-lg dark:shadow-2xl dark:border dark:border-grey rounded absolute ${
            open ? 'block bg-white dark:bg-meta-4' : 'hidden'
          }`}
          style={{ zIndex: 10, marginTop: 40, width: dropdownHeaderRef.current?.offsetWidth }}
        >
          <ul className="flex flex-col p-2">
            {(function () {
              const jsx: ReactNode[] = [];
              let i: number = 0;
              for (const act of actions) {
                const id: string =
                  'action-dropdown-' +
                  hashCode(`${entityName}-${act.action.name}-${act.action.description}`).toString();
                const idLoader: string = id + '-loader';
                jsx.push(
                  <li
                    key={i++}
                    className="relative items-center justify-center cursor-pointer hover:bg-[#f5f6fd] dark:hover:bg-meta-4"
                  >
                    <div
                      id={id}
                      className="group pb-1 relative flex items-center gap-2.5 rounded-md px-2 font-medium duration-300 ease-in-out dark:hover:text-white"
                      onClick={async () => {
                        /**
                         * Doing it here the traditional way to avoid variables for every single list element.
                         * Keep in mind that the common case is that only a few of these (<< 1000) will be pressed over the
                         * span of the webapp lifecycle. Thus having variables for each, for each entity is avoided.
                         */
                        const loaderElt: Nullable<HTMLElement> = document.getElementById(idLoader);
                        const listEntryElt: Nullable<HTMLElement> = document.getElementById(id);
                        if (loaderElt != null) {
                          loaderElt.classList.toggle('hidden');
                        }
                        if (listEntryElt != null) {
                          listEntryElt.classList.toggle('opacity-30');
                        }
                        await act.performAction();
                        if (loaderElt != null) {
                          loaderElt.classList.toggle('hidden');
                        }
                        if (listEntryElt != null) {
                          listEntryElt.classList.toggle('opacity-30');
                        }
                      }}
                    >
                      {act.action.title}
                    </div>
                    <div
                      id={idLoader}
                      className="absolute flex flex-col hidden"
                      style={{ width: '100%', top: 0, height: '100%' }}
                    >
                      <div
                        className="absolute bg-gradient-to-r from-transparent via-white via-50% to-white dark:via-meta-4 dark:via-50% dark:to-meta-4"
                        style={{ right: 0, width: 40, height: '100%' }}
                      >
                        <div
                          style={{ borderWidth: 3, top: 5, right: 0 }}
                          className="absolute h-4 w-4 animate-spin rounded-full border-2 border-solid border-grey border-t-transparent ml-1 mt-0 pt-0"
                        ></div>
                      </div>
                    </div>
                  </li>,
                );
              }

              return jsx;
            })()}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ActionDropdown;
