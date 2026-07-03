import { MouseEvent as ReactMouseEvent, ReactNode, useState } from 'react';
import { hashCode } from '../../utils/hashUtils';
import { isModifiedClick } from '../../utils/navClick';
import { GUIActionDropdownArg } from '../../utils/types/internal/actions';
import { Nullable } from '../../utils/types/typeUtils';
import Popover from './Popover';

// Color transform turning any (black) SVG icon into the same grey used for the
// action buttons (see ActionButton.tsx).
const GREY_ICON_FILTER =
  'brightness(0) saturate(100%) invert(42%) sepia(24%) saturate(434%) hue-rotate(176deg) brightness(99%) contrast(85%)';

// Minimum width of the opened dropdown menu (the trigger itself is just an icon).
const MINWIDTH_DROPDOWN = 180; // px

interface ActionDropdownProps {
  actions: GUIActionDropdownArg[];
  entityName: string;
}

/**
 * Assumes that the actions have been filtered previously (permission check) and that
 * the user does have permissions to execute.
 *
 * The menu is a {@link Popover} (portal + viewport-aware placement), which
 * replaces the previous hand-rolled offset-parent positioning and its
 * scroll/resize listeners: the table's `overflow` can no longer clip the menu,
 * and on phones it opens as a bottom sheet.
 *
 * @param actions the actions to display
 * @param entityName the name of the entity to apply the action to
 * @returns
 *
 * @satisfies ID: The actionable dropdown items have the ID "action-dropdown-" + hashCode(`${entityName}-${act.action.name}-${act.action.description}`).
 */
const ActionDropdown = ({ actions, entityName }: ActionDropdownProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const isEmpty = actions.length == 0;

  const trigger = (
    <div
      className={
        'inline-flex items-center justify-center border-t border-r border-b text-center gap-2.5 font-medium bg-[#f5f5f5] dark:bg-meta-4 rounded'
      }
      style={{
        position: 'relative',
        borderColor: 'rgb(0 0 0/0)',
        left: -1,
        zIndex: 1,
      }}
    >
      <div
        className={`group flex relative duration-300 hover:text-plainfont ${
          isEmpty ? 'opacity-40' : 'hover:scale-110'
        }`}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div
          className="group relative flex items-center justify-center border-t border-r border-b rounded-r"
          title="Other Actions"
          style={{
            borderColor: 'rgb(0 0 0/0)',
            height: 36,
            width: 36,
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <svg
            className={`-translate-y-1/6 fill-current ${open && 'rotate-180'}`}
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
  );

  return (
    <div className="group inline-flex flex-col">
      <Popover
        anchor={trigger}
        placement="bottom-end"
        maxWidth={360}
        maxHeight={400}
        role="menu"
        disabled={isEmpty}
        anchorClassName="w-auto"
        onOpenChange={setOpen}
      >
        <ul className="flex flex-col p-2" style={{ minWidth: MINWIDTH_DROPDOWN }}>
          {(function () {
            const jsx: ReactNode[] = [];
            let i: number = 0;
            for (const act of actions) {
              const id: string =
                'action-dropdown-' +
                hashCode(`${entityName}-${act.action.name}-${act.action.description}`).toString();
              const idLoader: string = id + '-loader';
              const itemClassName =
                'group pb-1 relative flex items-center gap-2.5 rounded-md px-2 font-medium duration-300 ease-in-out dark:hover:text-white';
              const onItemClick = async (e: ReactMouseEvent) => {
                // Navigating items (edit/view) are real links: leave modified /
                // middle clicks to the browser (open in a new tab), otherwise
                // intercept for in-app navigation.
                if (act.href != null) {
                  if (isModifiedClick(e)) return;
                  e.preventDefault();
                }
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
              };
              const itemInner = (
                <>
                  {act.action.icon ? (
                    <img
                      style={{ height: 20, width: 20, filter: GREY_ICON_FILTER }}
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(act.action.icon)}`}
                    />
                  ) : (
                    <></>
                  )}
                  <span>{act.action.title}</span>
                </>
              );
              jsx.push(
                <li
                  key={i++}
                  className="relative items-center justify-center cursor-pointer hover:bg-primary-5 dark:hover:bg-meta-4"
                >
                  {act.href != null ? (
                    <a
                      id={id}
                      href={act.href}
                      className={itemClassName}
                      style={{ textDecoration: 'none' }}
                      onClick={onItemClick}
                    >
                      {itemInner}
                    </a>
                  ) : (
                    <div id={id} className={itemClassName} onClick={onItemClick}>
                      {itemInner}
                    </div>
                  )}
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
      </Popover>
    </div>
  );
};

export default ActionDropdown;
