import { arrow, autoUpdate, flip, FloatingArrow, offset, useFloating } from '@floating-ui/react';
import { useRef } from 'react';

const InfoPanel = ({
  children,
  show,
  title,
  description,
}: {
  children: React.ReactNode;
  show: boolean;
  title?: string;
  description?: string;
}) => {
  const arrowRef = useRef(null);
  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'right',
    open: show,
    middleware: [
      arrow({
        element: arrowRef,
      }),
      offset(10),
      flip({
        fallbackPlacements: ['top', 'right', 'bottom'],
        fallbackStrategy: 'initialPlacement',
        flipAlignment: false,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <div ref={refs.setReference}>{children}</div>

      <div className={`absolute duration-300 z-50 ${show ? 'opacity-100' : 'opacity-0'}`}>
        {show ? (
          // https://austencam.com/posts/quick-tip-fixing-initial-position-and-transitions-with-floating-ui
          <div className="absolute top-0 left-0 z-50" ref={refs.setFloating} style={floatingStyles}>
            <FloatingArrow
              ref={arrowRef}
              context={context}
              style={
                placement.startsWith('right')
                  ? { left: 0 }
                  : placement.startsWith('top')
                  ? {}
                  : { top: -14 }
              }
              tipRadius={3}
              className="dark:fill-white"
            />
            <div className="border border-plainfont z-50 rounded ml-3 w-max max-w-[350px] max-h-[300px] overflow-y-auto bg-bg drop-shadow-xl">
              <div className="p-3">
                <h4 className="text-center text-title-sm font-bold text-solid text-plainfont hyphens-auto">
                  {title}
                </h4>
              </div>
              <div className="px-5 pt-1 pb-5 text-center">
                <p className="font-medium whitespace-pre-line hyphens-auto text-reducedfont">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      {/* </div>
      </div> */}
    </>
  );
};

export default InfoPanel;
