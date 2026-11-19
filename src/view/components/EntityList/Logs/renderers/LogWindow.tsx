import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MarkdownRender from '../../../Markdown';

const ICON_CLOSE =
  'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z';

/**
 * A round icon button of a {@link LogWindow}'s header, in the look of the
 * header buttons of VAYS (e.g. "back to list").
 */
export const WindowButton = ({
  icon,
  title,
  onClick,
  disabled = false,
}: {
  /** Path of a material symbol (viewBox 0 -960 960 960). */
  icon: string;
  /** Tooltip and accessible name. */
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[0.5px] border-stroke bg-primary-5 text-plainfont duration-300 enabled:hover:scale-110 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 dark:bg-meta-4 dark:text-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="h-5 w-5 fill-current"
      aria-hidden="true"
    >
      <path d={icon} />
    </svg>
  </button>
);

/**
 * The large window of the `window` log renderers (documents, how-tos, ...):
 * a modal dialog over the page in the look of the VAYS dialogs, with a header
 * (title, subtitle, the renderer's buttons and a close button) and the
 * content below. Closes on the close button, a click on the backdrop and
 * Escape — unless something inside (e.g. Monaco's find widget) already handled
 * the Escape.
 */
const LogWindow = ({
  title,
  subtitle,
  description,
  toolbar,
  size = 'large',
  onClose,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Markdown, shown below the header. */
  description?: string;
  /** {@link WindowButton}s, shown left of the close button. */
  toolbar?: React.ReactNode;
  /**
   * `large`: (almost) the whole screen, for documents the content scrolls in.
   * `content`: as high as the content (at most almost the screen) and of a
   * comfortable reading width, for texts.
   */
  size?: 'large' | 'content';
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose();
    };
    document.addEventListener('keydown', onKey);
    // Keyboard focus into the window (content may move it further, e.g. into
    // an editor), so Escape and Tab work right away.
    windowRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    // Above everything of the layout (the sidebar is z-9999): the window is modal.
    <div className="fixed inset-0 z-99999 flex items-center justify-center px-4 py-5">
      <div
        className="absolute inset-0 bg-black/90"
        onMouseDown={onClose}
        data-testid="log-window-backdrop"
      />
      <div
        ref={windowRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-sm bg-white px-6 py-6 outline-none dark:bg-boxdark md:px-10 md:py-8 ${
          size === 'large' ? 'h-full max-w-6xl' : 'max-w-180'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 grow">
            <h3 className="mt-0 text-xl font-bold text-plainfont hyphens-auto sm:text-2xl">
              {title}
            </h3>
            {subtitle && (
              <div className="pt-1 text-sm font-medium text-reducedfont">{subtitle}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {toolbar}
            <WindowButton icon={ICON_CLOSE} title="Close (Esc)" onClick={onClose} />
          </div>
        </div>
        {description && (
          <div className="pt-3 font-medium text-plainfont hyphens-auto">
            <MarkdownRender text={description} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col pt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default LogWindow;
