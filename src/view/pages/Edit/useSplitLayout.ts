import { RefObject, useEffect, useRef, useState } from 'react';
import { getCachedConfig } from '../../../model/config';
import iLocalStorage from '../../../session/persistent/LocalStorage';
import { EditorLayout } from '../../../utils/types/config';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

/** Below this container width the split is unavailable: only one pane at a time. */
const SIDE_BY_SIDE_MIN_WIDTH = 900;
/** Dragging the divider within this fraction of an edge snaps to single-pane. */
const SNAP = 0.12;

/**
 * Layout of the editor's two panes: which are shown, the split ratio, the
 * divider's chevrons and its drag. Layout and ratio persist in local storage.
 *
 * @param containerRef The editor frame (its width decides whether both fit).
 * @param panesRef The row holding both panes (the drag is relative to it).
 */
export function useSplitLayout(
  containerRef: RefObject<HTMLDivElement>,
  panesRef: RefObject<HTMLDivElement>,
) {
  const { width } = useContainerDimensions(containerRef);
  const isNarrow = (width ?? SIDE_BY_SIDE_MIN_WIDTH) < SIDE_BY_SIDE_MIN_WIDTH;

  // Layout + split ratio. The initial layout is the user's persisted choice, or
  // the `defaultEditorLayout` from config (default side-by-side) for first-time use.
  const [layout, setLayoutState] = useState<EditorLayout>(() =>
    iLocalStorage.getEditorLayout(getCachedConfig()?.defaultEditorLayout),
  );
  const [ratio, setRatio] = useState<number>(() => iLocalStorage.getEditorSplitRatio());
  const [dragging, setDragging] = useState<boolean>(false);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;
  const draggingRef = useRef(false);

  const setLayout = (l: EditorLayout) => {
    setLayoutState(l);
    iLocalStorage.setEditorLayout(l);
  };

  // Narrow screens cannot show both panes; fall back to the form side.
  const effLayout: EditorLayout = isNarrow && layout === 'both' ? 'form' : layout;
  const formVisible = effLayout !== 'yaml';
  const yamlVisible = effLayout !== 'form';
  const bothVisible = formVisible && yamlVisible;
  const formFrac = effLayout === 'form' ? 1 : effLayout === 'yaml' ? 0 : ratio;
  // Chevrons: on wide screens step form-only <-> both <-> yaml-only; on narrow
  // screens switch directly between the two single-pane views.
  const goLeft = () => setLayout(isNarrow ? 'yaml' : effLayout === 'form' ? 'both' : 'yaml');
  const goRight = () => setLayout(isNarrow ? 'form' : effLayout === 'yaml' ? 'both' : 'form');
  const leftDisabled = effLayout === 'yaml';
  const rightDisabled = effLayout === 'form';

  const startDrag = (e: React.MouseEvent) => {
    if (isNarrow) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !panesRef.current) return;
      const rect = panesRef.current.getBoundingClientRect();
      const r = (e.clientX - rect.left) / rect.width;
      // Snap to single-pane near an edge; otherwise split at the cursor.
      if (r < SNAP) {
        if (layoutRef.current !== 'yaml') setLayoutState('yaml');
      } else if (r > 1 - SNAP) {
        if (layoutRef.current !== 'form') setLayoutState('form');
      } else {
        setRatio(r);
        if (layoutRef.current !== 'both') setLayoutState('both');
      }
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      iLocalStorage.setEditorSplitRatio(ratioRef.current);
      iLocalStorage.setEditorLayout(layoutRef.current);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return {
    isNarrow,
    formVisible,
    yamlVisible,
    bothVisible,
    formFrac,
    dragging,
    startDrag,
    goLeft,
    goRight,
    leftDisabled,
    rightDisabled,
  };
}
