import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaGripLinesVertical } from 'react-icons/fa';
import { useBlocker } from 'react-router-dom';
import { showModalMessage } from '../../../controller/global/modal';
import {
  getActivatedActions,
  setChangeListener,
} from '../../../controller/local/EditController/ExpertMode/access';
import { sendYAMLData } from '../../../controller/local/EditController/ExpertMode';
import { newEditingView } from '../../../controller/local/EditController/session';
import {
  clearEditDirty,
  isEditDirty,
  isFormValid,
  setUsagesListener,
  setValidityListener,
} from '../../../controller/local/EditController/shared';
import { revalidateMeta } from '../../../controller/local/EditController/sync';
import { getCachedConfig } from '../../../model/config';
import iLocalStorage from '../../../session/persistent/LocalStorage';
import { LimitUsage } from '../../../utils/types/api';
import { EditorLayout } from '../../../utils/types/config';
import { RequestEditContext } from '../../../utils/types/internal/request';
import SubLoader from '../../thirdparty/components/SubLoader';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';
import ExpertMode from './ExpertMode/ExpertMode';
import MetaInfoPanel from './ExpertMode/MetaInfoPanel';
import StandardEditMode from './StandardEditMode';
import UsageIndicator from './UsageIndicator';

/** Below this container width the split is unavailable: only one pane at a time. */
const SIDE_BY_SIDE_MIN_WIDTH = 900;
/** Dragging the divider within this fraction of an edge snaps to single-pane. */
const SNAP = 0.12;
/** Width of the divider column (must fit the chevron buttons without clipping). */
const DIVIDER_W = '1.75rem';

/**
 * Renders the entity editing frame: an always-visible Name/Actions panel on top,
 * then a form pane (left) and a YAML pane (right) separated by a divider.
 *
 * The divider's chevrons step through form-only / both / yaml-only and (on wide
 * screens) it can be dragged to resize. The chosen layout + split ratio persist
 * in local storage. On narrow screens only one pane shows at a time and the
 * chevrons switch directly between form-only and yaml-only.
 *
 * Both panes stay mounted and are kept in sync via the canonical `{data, yaml}`
 * pair (see `sync.ts`).
 *
 * @component
 * @param {RequestEditContext} props.requestEditContext - The request/edit context.
 */
const EditFrame = ({
  requestEditContext,
}: {
  requestEditContext: RequestEditContext;
}): JSX.Element => {
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [yacErrorMsg, setYACErrorMsg] = useState<string>('');
  const [isDisplayingYACError, setIsDisplayingYACError] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(requestEditContext.mode === 'read');
  const [usages, setUsages] = useState<LimitUsage[]>([]);
  const [isValid, setIsValid] = useState<boolean>(isFormValid());
  // Whether the save payload differs from the stored file (see access.ts's
  // hasUncommittedChanges); kept current via setChangeListener below.
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  // Every mount of the edit frame is a new editing view: the panes' session
  // activations (beginPaneSession) key off this, so returning to the SAME
  // entity still starts a fresh session. Render-time on purpose — the panes'
  // effects run before this component's own effects would.
  useMemo(() => newEditingView(), []);

  // A single loading indicator for the whole editor: shown until both panes have
  // finished their initial schema load.
  const [formLoading, setFormLoading] = useState<boolean>(true);
  const [yamlLoading, setYamlLoading] = useState<boolean>(true);
  const isLoading = formLoading || yamlLoading;
  // Titles of the actions the user has selected (in the MetaInfoPanel), shown on
  // the Commit button. Refreshed whenever the panel reports a change.
  const [actionTitles, setActionTitles] = useState<string[]>([]);
  const refreshActionTitles = () =>
    setActionTitles(getActivatedActions().map((a) => a.title || a.name));
  // Whether the YAML editor currently has focus. Used to dim the inactive pane:
  // YAML focused -> dim the form; otherwise (form focused or nothing -> default)
  // -> dim the YAML editor.
  const [yamlFocused, setYamlFocused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panesRef = useRef<HTMLDivElement>(null);
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
  // Dim the inactive pane (only meaningful when both are shown). The overlay
  // whitens in light mode and darkens in dark mode; pointer-events stay off so a
  // click reaches the pane and focuses it (which removes the dim).
  const dimOverlay =
    'pointer-events-none absolute inset-0 z-10 bg-white/50 transition-opacity ' +
    'duration-200 dark:bg-black/40';

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

  useEffect(() => {
    setUsagesListener(setUsages);
    setValidityListener(setIsValid);
    // Tracks whether the payload differs from the stored file (edit mode's
    // no-op guard on the Commit button; registering pushes the current state).
    setChangeListener(setHasChanges);
    return () => {
      setUsagesListener(null);
      setValidityListener(null);
      setChangeListener(null);
    };
  }, []);

  useEffect(() => {
    setIsReadOnly(requestEditContext.mode === 'read');
  }, [requestEditContext.mode]);

  // Warn before leaving the editor with unsaved changes. The base path of the
  // current edit session is allowed (e.g. the URL gaining the new name while
  // creating); navigating anywhere else while dirty prompts a confirmation.
  const editBase = `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}`;
  const blocker = useBlocker(
    ({ nextLocation }) => isEditDirty() && !nextLocation.pathname.startsWith(editBase),
  );
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    showModalMessage(
      'Discard unsaved changes?',
      'You have unsaved changes in this editor. If you leave now, they will be lost.',
      async () => {
        clearEditDirty();
        blocker.proceed();
      },
      async () => {
        blocker.reset();
      },
      'Leave',
    );
  }, [blocker]);

  // Cover full-page navigations (refresh, tab close, external URL) with the
  // browser's native prompt while there are unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isEditDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Reset the selected-action labels when switching to another entity.
  useEffect(() => {
    setActionTitles([]);
  }, [
    requestEditContext.entityName,
    requestEditContext.mode,
    requestEditContext.rc.entityTypeName,
  ]);

  // Nothing to commit (edit mode): the document equals the stored file, and
  // the backend would reject the PUT as a no-op (400). Injected defaults or
  // any pane edit make the payload differ and re-enable the button.
  const nothingToCommit = requestEditContext.mode === 'edit' && !hasChanges;
  const saveDisabled = isValidating || !isValid || nothingToCommit;
  const commitLabel = actionTitles.length ? `Commit + ${actionTitles.join(' + ')}` : 'Commit';

  const setEditErrorMsg = (msg: string) => {
    if (msg === '') {
      setIsDisplayingYACError(false);
    } else {
      setYACErrorMsg(msg);
      setIsDisplayingYACError(true);
    }
  };

  const chevronBtn =
    'rounded border border-stroke bg-white p-0.5 text-reducedfont enabled:hover:text-plainfont ' +
    'enabled:hover:border-primary disabled:opacity-30 disabled:cursor-default dark:bg-boxdark dark:border-meta-4';

  return (
    <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
      <div
        ref={containerRef}
        className="relative px-4 overflow-hidden md:px-8 flex flex-col"
        // Definite (not min-) height so the editor cannot grow past this envelope
        // and push the footer/Commit button off-screen. The always-visible
        // MetaInfoPanel and footer take their natural height; the panes flex to
        // fill whatever is left (see the `grow min-h-0` panes container below).
        // Viewport-relative (100vh minus the surrounding header/breadcrumb/
        // padding) so it tracks window resizes, unlike the former
        // `window.outerHeight` snapshot which included browser chrome and never
        // updated.
        style={{ height: 'calc(100vh - 240px)' }}
      >
        {/* Always-visible Name + Actions. */}
        {!isReadOnly && (
          <MetaInfoPanel
            requestEditContext={requestEditContext}
            updateCallback={() => {
              revalidateMeta(requestEditContext);
              refreshActionTitles();
            }}
          />
        )}

        {/* `grow` fills the space left by the panel + footer; `min-h-0` lets the
            panes shrink below their content so the form / Monaco scroll internally
            instead of stretching the page. */}
        <div ref={panesRef} className="relative grow min-h-0 flex flex-row">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-70 dark:bg-boxdark dark:bg-opacity-70">
              <SubLoader action="Loading editor" />
            </div>
          )}
          {/* Transparent overlay so a drag keeps receiving mouse events even over
              the Monaco editor (which otherwise swallows them). */}
          {dragging && <div className="fixed inset-0 z-40 cursor-col-resize" />}

          <div
            className={`${formVisible ? 'flex' : 'hidden'} relative flex-col min-w-0 overflow-hidden`}
            style={{ width: `calc((100% - ${DIVIDER_W}) * ${formFrac})` }}
          >
            {/* `isolate` opens a stacking context so the pane content's own
                z-indexes (dropdowns z-20/30, multi-select z-40/50, info
                popouts z-50) cannot escape past the sibling dim overlay
                (z-10) below. */}
            <div className="isolate flex grow flex-col min-h-0 min-w-0 overflow-hidden">
              <StandardEditMode
                requestEditContext={requestEditContext}
                setEditErrorMsg={setEditErrorMsg}
                setIsValidating={setIsValidating}
                setLoading={setFormLoading}
              />
            </div>
            {bothVisible && (
              <div className={`${dimOverlay} ${yamlFocused ? 'opacity-100' : 'opacity-0'}`} />
            )}
          </div>

          {/* Divider: always present (between the panes, or at the edge when one
              side is collapsed). Draggable on wide screens. */}
          <div
            onMouseDown={startDrag}
            title={isNarrow ? undefined : 'Drag to resize'}
            className={`relative flex-none flex items-center justify-center group ${
              isNarrow ? '' : 'cursor-col-resize'
            }`}
            style={{ width: DIVIDER_W }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-stroke dark:bg-meta-4 group-hover:bg-primary" />
            {/* Only the buttons stop the drag; the grip / gaps remain draggable. */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <button
                type="button"
                title={leftDisabled ? undefined : 'Show more of the YAML editor'}
                disabled={leftDisabled}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={goLeft}
                className={chevronBtn}
              >
                <FaChevronLeft size={12} />
              </button>
              {!isNarrow && (
                <FaGripLinesVertical className="text-reducedfont pointer-events-none" size={12} />
              )}
              <button
                type="button"
                title={rightDisabled ? undefined : 'Show more of the form'}
                disabled={rightDisabled}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={goRight}
                className={chevronBtn}
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          <div
            className={`${yamlVisible ? 'flex' : 'hidden'} flex-col relative min-w-0 overflow-hidden`}
            style={{ width: `calc((100% - ${DIVIDER_W}) * ${1 - formFrac})` }}
          >
            {/* Same stacking-context isolation as the form pane, so Monaco's
                internal widgets cannot escape past the dim overlay either. */}
            <div className="isolate flex grow flex-col min-h-0 min-w-0 overflow-hidden">
              <ExpertMode
                requestContext={requestEditContext}
                setEditErrorMsg={setEditErrorMsg}
                setIsValidating={setIsValidating}
                setLoading={setYamlLoading}
                setFocused={setYamlFocused}
                visible={yamlVisible}
              />
            </div>
            {bothVisible && (
              <div className={`${dimOverlay} ${!yamlFocused ? 'opacity-100' : 'opacity-0'}`} />
            )}
          </div>
        </div>

        <div
          className="relative flex group w-full shrink-0 mt-1 border-t"
          style={{ height: 55, borderColor: '#ddddddaa' }}
        >
          <div
            className={`relative flex flex-col grow  mt-4 p-1.5 rounded duration-1000 opacity-0 overflow-x-hidden border-l-4 ${
              isDisplayingYACError && 'opacity-100'
            }`}
            style={{
              backgroundColor: 'rgb(211 47 47 / 0.08)',
              borderColor: '#d32f2f',
            }}
          >
            <span className={`text-wrap text-[#d32f2f] ${isReadOnly ? 'opacity-0' : ''}`}>
              {yacErrorMsg}
            </span>
          </div>
          {isReadOnly ? (
            <></>
          ) : (
            <div className="flex items-center px-2">
              <UsageIndicator usages={usages} />
            </div>
          )}
          {isReadOnly ? (
            <></>
          ) : (
            <div
              className=" grid place-items-center align-middle h-full"
              style={{ right: 0, bottom: 0 }}
            >
              <button
                type="button"
                disabled={saveDisabled}
                title={
                  !isValid && !isValidating
                    ? 'Resolve the highlighted errors before saving.'
                    : nothingToCommit && !isValidating
                      ? 'Nothing to commit: the document matches what is stored.'
                      : undefined
                }
                onClick={() => {
                  // Unified save: the canonical YAML (kept current no matter which
                  // pane was edited) is PUT, preserving comments/order.
                  sendYAMLData(requestEditContext);
                }}
                className={`inline-flex items-center justify-center rounded border py-1.5 px-4 m-4 text-center font-medium ${
                  saveDisabled
                    ? 'cursor-not-allowed border-stroke text-reducedfont opacity-50'
                    : 'cursor-pointer border-black dark:border-meta-4 text-plainfont hover:bg-opacity-90 hover:bg-primary hover:text-white dark:bg-meta-4 dark:hover:bg-white dark:hover:text-black'
                }`}
              >
                {isValidating ? (
                  <div
                    style={{ borderWidth: 3, right: 10 }}
                    className=" h-4 w-4 animate-spin rounded-full border-2 border-solid border-grey border-t-transparent z-10"
                  ></div>
                ) : (
                  commitLabel
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EditFrame;
