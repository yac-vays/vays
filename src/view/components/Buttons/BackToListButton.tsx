import { useNavigate } from 'react-router-dom';
import { buildOverviewHighlightURL } from '../../../controller/global/url';
import { isModifiedClick } from '../../../utils/navClick';

interface BackToListButtonProps {
  backendName: string | undefined;
  entityTypeName: string | undefined;
  /** The entity to highlight in the list; omit to open the plain list. */
  entityName?: string;
}

/**
 * Circular top-bar button leading from the edit/read form back to the entity
 * list. When an entity name is given the list opens with `?name=` so the row
 * is highlighted and scrolled into view.
 *
 * It is a real link so it can be opened in a new tab; plain clicks navigate
 * in-app (and therefore go through the unsaved-changes guard of the editor).
 */
const BackToListButton = ({ backendName, entityTypeName, entityName }: BackToListButtonProps) => {
  const navigate = useNavigate();
  const href = buildOverviewHighlightURL(backendName, entityTypeName, entityName);
  return (
    <a
      href={href}
      title={entityName ? `Back to list (highlight ${entityName})` : 'Back to list'}
      onClick={(e) => {
        if (isModifiedClick(e)) return;
        e.preventDefault();
        navigate(href);
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-stroke bg-primary-5 duration-300 hover:scale-110 hover:text-primary dark:bg-meta-4 dark:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="fill-current"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
      >
        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
      </svg>
    </a>
  );
};

export default BackToListButton;
