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

  // The chevrons FLOAT over the tab strip (they are overlays, not part of the
  // scrollable content): the strip's layout never changes with the scroll
  // state, so reaching an edge just fades the chevron away without the tabs
  // jumping. The gradient keeps the tab underneath readable.
  const scrollBtn = 'absolute inset-y-0 cursor-pointer flex items-center px-1';
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
      </div>
      {canScrollLeft && (
        <div
          className={`${scrollBtn} left-0 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-boxdark dark:via-boxdark/70`}
          onClick={() => cbar.current?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })}
        >
          {chevron('M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z')}
        </div>
      )}
      {canScrollRight && (
        <div
          className={`${scrollBtn} right-0 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-boxdark dark:via-boxdark/70`}
          onClick={() => cbar.current?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })}
        >
          {chevron('M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z')}
        </div>
      )}
    </div>
  );
};

export default ControlBar;
