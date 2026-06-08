import { createPortal } from 'react-dom';
import { useHeaderSlots } from '../Header/HeaderSlots';

interface PageHeaderTitleProps {
  title: React.ReactNode;
  subText: string;
  /** Action buttons rendered into the top bar (e.g. refresh, description toggle). */
  children?: React.ReactNode;
}

/**
 * Publishes a page's title and action buttons into the shared top bar (`Header`)
 * via its slots, and renders the optional `subText` at the top of the page body.
 */
const PageHeaderTitle = ({ title, subText, children }: PageHeaderTitleProps) => {
  const { titleEl, actionsEl } = useHeaderSlots();

  return (
    <>
      {titleEl &&
        createPortal(
          <h2 className="truncate text-lg font-semibold text-plainfont md:text-title-md2">
            {title}
          </h2>,
          titleEl,
        )}
      {actionsEl && children && createPortal(children, actionsEl)}
      {subText && (
        <p className="mb-5 text-medium md:text-title-sm" style={{ whiteSpace: 'pre-wrap' }}>
          {subText}
        </p>
      )}
    </>
  );
};

export default PageHeaderTitle;
