import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement,
  safePolygon,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useEffect, useRef, useState } from 'react';
import useMediaQuery from '../../hooks/useMediaQuery';

/** Space always kept between a popover and the viewport edges. */
const VIEWPORT_PADDING = 8;

/**
 * Below Tailwind's `sm` breakpoint an anchored popover barely fits anywhere;
 * the content renders as a bottom sheet instead (see below).
 */
const SMALL_SCREEN_QUERY = '(max-width: 639px)';

interface PopoverProps {
  /** The always-visible trigger (icon, indicator, ...). */
  anchor: React.ReactNode;
  /** The panel content. */
  children: React.ReactNode;
  /** Preferred placement; flip/shift adjust it to the available space. */
  placement?: Placement;
  /** Preferred content size; shrunk when the viewport offers less. */
  maxWidth?: number;
  maxHeight?: number;
  /** Also open on hover/focus (descriptions, errors); click always toggles. */
  openOnHover?: boolean;
  /** ARIA role of the panel. */
  role?: 'tooltip' | 'dialog' | 'menu';
  /** A disabled trigger renders but never opens (e.g. an empty action menu). */
  disabled?: boolean;
  /** Extra classes for the (size-neutral) anchor button. */
  anchorClassName?: string;
  /** Extra classes for the panel chrome (border/background are the default). */
  panelClassName?: string;
  /** Notifies the trigger about open/close (e.g. to rotate a chevron). */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The one popup primitive for info boxes, error details, log panels and
 * dropdown menus.
 *
 * On regular screens it is an anchored floating panel that ALWAYS fits the
 * viewport: `flip` picks the side, `shift` slides it along the edge, and
 * `size` shrinks the content below its preferred maximum when the viewport
 * offers less space (the previous fixed `max-w`/`max-h` classes overflowed
 * small screens). It renders through a portal, so scroll containers (the form
 * pane, the entity table) can never clip it.
 *
 * On small screens (phones) the same content renders as a bottom sheet with a
 * backdrop instead — anchored popovers on a ~360px viewport are cramped no
 * matter how well they are clamped.
 *
 * Interactions come from floating-ui: click toggles (touch friendly), hover /
 * focus optionally open (with `safePolygon`, so moving the pointer into the
 * panel does not close it), Escape and outside-press dismiss.
 */
const Popover = ({
  anchor,
  children,
  placement = 'right',
  maxWidth = 350,
  maxHeight = 300,
  openOnHover = false,
  role = 'dialog',
  disabled = false,
  anchorClassName = '',
  panelClassName = '',
  onOpenChange,
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isSmallScreen = useMediaQuery(SMALL_SCREEN_QUERY);

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setOpen,
    middleware: [
      offset(10),
      flip(),
      // Slide along the chosen side so the panel never pokes out of the
      // viewport (flip alone only changes sides).
      shift({ padding: VIEWPORT_PADDING }),
      // Shrink the content below its preferred maximum when the viewport
      // offers less space than the preferred `maxWidth`/`maxHeight`.
      size({
        padding: VIEWPORT_PADDING,
        apply({ availableWidth, availableHeight }) {
          const el = contentRef.current;
          if (el == null) return;
          el.style.maxWidth = `${Math.round(Math.min(maxWidth, Math.max(120, availableWidth)))}px`;
          el.style.maxHeight = `${Math.round(Math.min(maxHeight, Math.max(120, availableHeight)))}px`;
        },
      }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: openOnHover && !disabled && !isSmallScreen,
    handleClose: safePolygon(),
  });
  const focus = useFocus(context, { enabled: openOnHover && !disabled });
  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context, { outsidePress: true });
  const ariaRole = useRole(context, { role });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    ariaRole,
  ]);

  // A disabled trigger must not leave a panel behind (deliberately keyed on
  // `disabled` only: it closes on the transition, not on every render).
  useEffect(() => {
    if (disabled && isOpen) setOpen(false);
  }, [disabled]);

  const panelChrome = `border border-stroke rounded bg-bg drop-shadow-xl overflow-y-auto overflow-x-hidden ${panelClassName}`;

  return (
    <>
      {/* Size-neutral button: no UA padding/border/background, sized by its
          content so the trigger does not shift or squeeze surrounding content
          vs a plain (non-interactive) render of the same anchor. Deliberately
          NOT w-full: as a flex child that would claim the whole row and crush
          the siblings (e.g. a checkbox title next to its info icon). */}
      <button
        type="button"
        className={`block appearance-none border-0 bg-transparent p-0 text-left ${
          disabled ? 'cursor-default' : 'cursor-pointer'
        } ${anchorClassName}`}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {anchor}
      </button>

      {isOpen && (
        <FloatingPortal>
          {isSmallScreen ? (
            // Bottom sheet: full-width, height-capped, above a backdrop. The
            // backdrop press is an "outside press" for useDismiss and closes.
            <div className="fixed inset-0 z-999">
              <div className="absolute inset-0 bg-black/40" />
              <div
                ref={refs.setFloating}
                {...getFloatingProps()}
                className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-lg border-t border-stroke bg-bg drop-shadow-xl"
              >
                {children}
              </div>
            </div>
          ) : (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-999"
            >
              <FloatingArrow
                ref={arrowRef}
                context={context}
                tipRadius={3}
                className="dark:fill-white"
              />
              <div ref={contentRef} style={{ maxWidth, maxHeight }} className={panelChrome}>
                {children}
              </div>
            </div>
          )}
        </FloatingPortal>
      )}
    </>
  );
};

export default Popover;
