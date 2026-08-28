import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { RequestEditContext } from '../../../../../utils/types/internal/request';

/**
 * monaco-yaml anchors a "Missing property" diagnostic on the object node,
 * which for the document root visually lands on the FIRST property of the
 * document — even though the natural place to add the missing property is at
 * its end. This plugin relocates such markers to the (phantom) last line of
 * the document, where the user would type the property.
 *
 * Only root-level diagnostics are relocated: their anchor (the document's
 * first property) sits at column 1, whereas nested objects — e.g. elements
 * of a list — are always indented, so their markers already point at the
 * right object and must stay where they are.
 */

/** monaco-yaml's fixed wording for a violated `required` (VAYS does not localize). */
const MISSING_PROPERTY = /^Missing property /;

/** The marker fields the relocation rewrites. */
interface MarkerRange {
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

/**
 * Rewrite every root-level missing-property marker to the target (last) line.
 * Returns null when nothing needed to change — the caller MUST then not
 * re-set the markers, otherwise the resulting marker-change event would loop
 * forever.
 */
export function relocateMissingPropertyMarkers<T extends MarkerRange>(
  markers: T[],
  targetLine: number,
  targetMaxColumn: number,
): T[] | null {
  const needsMove = (m: MarkerRange) =>
    MISSING_PROPERTY.test(m.message) &&
    // Column 1 = anchored on a root-level property; indented (nested) object
    // markers are already in the right place.
    m.startColumn === 1 &&
    (m.startLineNumber !== targetLine ||
      m.endLineNumber !== targetLine ||
      m.endColumn !== targetMaxColumn);
  if (!markers.some(needsMove)) return null;
  return markers.map((m) =>
    needsMove(m)
      ? {
          ...m,
          startLineNumber: targetLine,
          startColumn: 1,
          endLineNumber: targetLine,
          endColumn: targetMaxColumn,
        }
      : m,
  );
}

// Global (monaco-level) listener, disposed on editor teardown (see Editor.tsx).
let relocatorListener: monaco.IDisposable | null = null;
let relocatorSafetyInterval: number | null = null;

export function disposeMissingPropertyRelocator() {
  relocatorListener?.dispose();
  relocatorListener = null;
  if (relocatorSafetyInterval != null) {
    window.clearInterval(relocatorSafetyInterval);
    relocatorSafetyInterval = null;
  }
}

/** Run one relocation pass for the model behind `resource` (no-op when clean). */
function relocateForResource(resource: monaco.Uri) {
  const model = monaco.editor.getModel(resource);
  if (model == null) return;
  const targetLine = model.getLineCount();
  const targetMaxColumn = model.getLineMaxColumn(targetLine);

  // Markers are owned per validation source (monaco-yaml, yac-backend, ...);
  // rewrite within each owner group so no source's markers are dropped.
  const byOwner = new Map<string, monaco.editor.IMarker[]>();
  for (const marker of monaco.editor.getModelMarkers({ resource })) {
    const group = byOwner.get(marker.owner);
    if (group) group.push(marker);
    else byOwner.set(marker.owner, [marker]);
  }
  for (const [owner, markers] of byOwner) {
    const relocated = relocateMissingPropertyMarkers(markers, targetLine, targetMaxColumn);
    // `null` = already in place; re-setting would re-fire the listener forever.
    if (relocated != null) {
      monaco.editor.setModelMarkers(model, owner, relocated);
    }
  }
}

export default async function editorMissingPropertyRelocator(
  ed: monaco.editor.IStandaloneCodeEditor,
  _ctx: RequestEditContext,
  reInvoked: boolean = false,
) {
  // Match the errorDecoration plugin's lifecycle: install once per editor.
  if (reInvoked) return;
  // Never stack listeners: the previous editor's listener (if any) is gone.
  disposeMissingPropertyRelocator();

  relocatorListener = monaco.editor.onDidChangeMarkers((resources) => {
    // Every changed resource, not just the first: batches can carry several.
    for (const resource of resources) relocateForResource(resource);
  });

  // Safety net: marker writes race around rapid schema updates + worker
  // restarts (monaco-yaml revalidates on its own debounce AND on every app
  // validation round-trip), and coalesced change events have been observed to
  // leave the LAST write un-relocated. Re-assert periodically — the pass is a
  // few marker compares and writes nothing when everything is in place.
  relocatorSafetyInterval = window.setInterval(() => {
    const model = ed.getModel();
    if (model != null) relocateForResource(model.uri);
  }, 500);
}
