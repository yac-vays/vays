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
  isError = false,
}: {
  /** The trigger. */
  children: React.ReactNode;
  title?: string;
  description?: string;
  isMarkdown?: boolean;
  /** Error styling: red body text (used by the error indicator's panel). */
  isError?: boolean;
}) => {
  return (
    <Popover anchor={children} openOnHover role="dialog" maxWidth={350} maxHeight={300}>
      {title ? (
        <div className="p-3">
          <h4 className="text-center text-title-sm font-bold text-solid text-plainfont hyphens-auto">
            {title}
          </h4>
        </div>
      ) : null}
      <div className={`px-5 pb-5 text-left ${title ? 'pt-1' : 'pt-4'}`}>
        <p
          className={`font-medium whitespace-pre-line hyphens-auto break-words ${
            isError ? 'text-[#d32f2f]' : 'text-reducedfont'
          }`}
        >
          {isMarkdown ? <MarkdownRender text={description} /> : description}
        </p>
      </div>
    </Popover>
  );
};

export default InfoPanel;
