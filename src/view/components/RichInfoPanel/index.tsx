import { useRef, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, arrow, FloatingArrow } from '@floating-ui/react';
import useOutsideClick from '../../hooks/useOutsideClick';

const RichInfoPanel = ({
  children,
  anchor,
}: {
  children: React.ReactNode;
  anchor: React.ReactNode;
}) => {
  const arrowRef = useRef(null);
  const infoPanelRef = useRef(null);
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

  useOutsideClick(infoPanelRef, () => setIsOpen(false));

  return (
    <>
      <div ref={infoPanelRef}>
        <button
          className="cursor-pointer"
          ref={refs.setReference}
          onClick={() => setIsOpen(!isOpen)}
        >
          {anchor}
        </button>

        <div className={`absolute duration-300 z-40 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {isOpen ? (
            // https://austencam.com/posts/quick-tip-fixing-initial-position-and-transitions-with-floating-ui
            <div
              className="absolute top-0 left-0 z-50"
              ref={refs.setFloating}
              style={floatingStyles}
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
          ) : (
            <></>
          )}
        </div>
      </div>
      {/* </div>
      </div> */}
    </>
  );
};

export default RichInfoPanel;
