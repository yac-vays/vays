import { useEffect, useRef, useState } from 'react';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

interface ControlBarProps {
  children: React.ReactNode;
}

const ControlBar = ({ children }: ControlBarProps) => {
  const [showFurther, setShowFurther] = useState<boolean>(false);
  const cbar = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerDimensions(cbar, 0, 0);

  useEffect(() => {
    if (cbar.current == null) return;
    if (cbar.current.clientWidth < cbar.current.scrollWidth) {
      setShowFurther(true);
    } else {
      setShowFurther(false);
    }
  }, [cbar, width, children]);

  return (
    <>
      <div
        ref={cbar}
        className="static mb-1 flex gap-4 border-b border-stroke dark:bg-boxdark sm:gap-10"
        role="tablist"
        style={{ overflowX: 'scroll', scrollbarWidth: 'none' }}
      >
        {children}
        {showFurther ? (
          <>
            <div className="cursor-pointer border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base border-transparent opacity-0">
              {' '}
              .........
            </div>
            <div
              className="absolute bg-white cursor-pointer dark:bg-boxdark"
              style={{ top: 0, right: 0, height: cbar.current?.clientHeight }}
              onClick={() => {
                if (cbar.current?.scrollLeft != undefined) {
                  cbar.current.scrollLeft += 100;
                }
              }}
            >
              <div className="pl-3 pt-4 pr-1 pb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="grey"
                >
                  <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ControlBar;
