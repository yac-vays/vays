import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MarkdownRender from '../../../Markdown';

/** Shared look of the toolbar buttons of a {@link LogWindow}. */
export const WINDOW_BUTTON_CLASS =
  'flex items-center gap-1 rounded-sm border border-stroke px-2 py-1 text-sm text-solid hover:bg-gray-500/10 disabled:opacity-40 disabled:hover:bg-transparent';

/** Material-symbol icon in the size of the window's buttons. */
export const WindowIcon = ({ path, className = '' }: { path: string; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    className={`h-4 w-4 fill-current ${className}`}
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

export const ICON_CLOSE =
  'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z';

/**
 * The large window of the `window` log renderers (documents, how-tos, ...):
 * a modal dialog over the page with a header (title, subtitle, the renderer's
 * toolbar and a close button) and the content below. Closes on the close
 * button, a click on the backdrop and Escape — unless something inside (e.g.
 * Monaco's find widget) already handled the Escape.
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
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onMouseDown={onClose} data-testid="log-window-backdrop" />
      <div
        ref={windowRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-sm border border-stroke bg-bg drop-shadow-xl outline-none ${
          size === 'large' ? 'h-full max-w-6xl' : 'max-w-3xl'
        }`}
      >
        <div className="flex flex-wrap items-start gap-3 border-b border-stroke p-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-title-sm font-bold text-solid hyphens-auto">{title}</h4>
            {subtitle && <div className="text-sm text-reducedfont">{subtitle}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            <button
              type="button"
              className={WINDOW_BUTTON_CLASS}
              onClick={onClose}
              aria-label="Close"
              title="Close (Esc)"
            >
              <WindowIcon path={ICON_CLOSE} />
            </button>
          </div>
        </div>
        {description && (
          <div className="border-b border-stroke px-4 py-2 text-sm text-reducedfont hyphens-auto">
            <MarkdownRender text={description} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default LogWindow;
