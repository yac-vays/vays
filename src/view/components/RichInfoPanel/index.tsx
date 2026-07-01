import { useRef, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  arrow,
  FloatingArrow,
  useClick,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';

const RichInfoPanel = ({
  children,
  anchor,
}: {
  children: React.ReactNode;
  anchor: React.ReactNode;
}) => {
  const arrowRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'right',
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      arrow({
        element: arrowRef,
      }),
      offset(10),
      flip({
        fallbackPlacements: ['left', 'top', 'bottom', 'right'],
        fallbackStrategy: 'initialPlacement',
        flipAlignment: false,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Toggle on the anchor, and dismiss on any press outside the panel/anchor (or
  // Escape). `useDismiss` tracks both the reference and floating elements, so a
  // click inside the panel keeps it open while a click anywhere else closes it.
  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  return (
    <>
      {/* Size-neutral button: no UA padding/border/background, fills the anchor
          box exactly so the trigger does not shift the content vs a plain
          (non-interactive) render of the same anchor. */}
      <button
        className="cursor-pointer block w-full appearance-none border-0 bg-transparent p-0"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {anchor}
      </button>

      {isOpen && (
        // https://austencam.com/posts/quick-tip-fixing-initial-position-and-transitions-with-floating-ui
        <div
          className="absolute top-0 left-0 z-50"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <FloatingArrow
            ref={arrowRef}
            context={context}
            style={
              placement.startsWith('right')
                ? { left: 0 }
                : placement.startsWith('top')
                ? {}
                : placement.startsWith('left')
                ? { left: 360 }
                : { top: -14 }
            }
            tipRadius={3}
            className="dark:fill-white"
          />

          {children}
        </div>
      )}
    </>
  );
};

export default RichInfoPanel;
