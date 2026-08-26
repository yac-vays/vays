import Popover from '../Popover';
import MarkdownRender from '../Markdown';

/**
 * Titled info panel behind a trigger (the (i)/error icons next to form
 * labels). A thin layout on top of {@link Popover}, which owns all opening
 * (hover/focus/click), dismissal, placement and viewport-fitting behavior.
 */
const InfoPanel = ({
  children,
  title,
  description,
  isMarkdown = false,
}: {
  /** The trigger. */
  children: React.ReactNode;
  title?: string;
  description?: string;
  isMarkdown?: boolean;
}) => {
  return (
    <Popover anchor={children} openOnHover role="dialog" maxWidth={350} maxHeight={300}>
      <div className="p-3">
        <h4 className="text-center text-title-sm font-bold text-solid text-plainfont hyphens-auto">
          {title}
        </h4>
      </div>
      <div className="px-5 pt-1 pb-5 text-left">
        <p className="font-medium whitespace-pre-line hyphens-auto break-words text-reducedfont">
          {isMarkdown ? <MarkdownRender text={description} /> : description}
        </p>
      </div>
    </Popover>
  );
};

export default InfoPanel;
