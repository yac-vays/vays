import { createPortal } from 'react-dom';
import { useHeaderSlots } from '../Header/HeaderSlots';

interface PageHeaderTitleProps {
  title: React.ReactNode;
  /** Optional intro text at the top of the page body. */
  subText?: string;
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
          // `min-w-0` lets this flex item shrink below its content width so the
          // title truncates instead of pushing the top-bar action buttons off
          // the (overflow-hidden) screen on small viewports.
          <h2 className="min-w-0 truncate text-base font-semibold text-plainfont sm:text-lg md:text-title-md2">
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
