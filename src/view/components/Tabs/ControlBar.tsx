import { useCallback, useEffect, useRef, useState } from 'react';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

interface ControlBarProps {
  children: React.ReactNode;
}

/** How far one click on a scroll chevron moves the tab strip (px). */
const SCROLL_STEP = 100;

const ControlBar = ({ children }: ControlBarProps) => {
  // Which scroll chevrons are needed: left when scrolled away from the start,
  // right while more tabs are hidden past the end.
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const cbar = useRef<HTMLDivElement>(null);
  const { width } = useContainerDimensions(cbar, 0, 0);

  const updateScrollability = useCallback(() => {
    const el = cbar.current;
    if (el == null) return;
    setCanScrollLeft(el.scrollLeft > 0);
    // -1: tolerate fractional scroll positions at the right edge.
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollability();
  }, [updateScrollability, width, children]);

  const scrollBtn =
    'absolute inset-y-0 cursor-pointer bg-white dark:bg-boxdark flex items-center px-1';
  const chevron = (path: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey">
      <path d={path} />
    </svg>
  );

  return (
    <div className="relative mb-1">
      <div
        ref={cbar}
        className="static flex gap-4 border-b border-stroke dark:bg-boxdark sm:gap-10 whitespace-nowrap"
        role="tablist"
        style={{ overflowX: 'scroll', scrollbarWidth: 'none' }}
        onScroll={updateScrollability}
      >
        {children}
        {canScrollRight ? (
          // Invisible spacer so the last tab can be scrolled clear of the
          // right chevron overlay.
          <div className="border-b-2 py-4 text-sm font-medium md:text-base border-transparent opacity-0">
            {' '}
            .........
          </div>
        ) : (
          <></>
        )}
      </div>
      {canScrollLeft && (
        <div
          className={`${scrollBtn} left-0`}
          onClick={() => cbar.current?.scrollBy({ left: -SCROLL_STEP })}
        >
          {chevron('M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z')}
        </div>
      )}
      {canScrollRight && (
        <div
          className={`${scrollBtn} right-0`}
          onClick={() => cbar.current?.scrollBy({ left: SCROLL_STEP })}
        >
          {chevron('M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z')}
        </div>
      )}
    </div>
  );
};

export default ControlBar;
