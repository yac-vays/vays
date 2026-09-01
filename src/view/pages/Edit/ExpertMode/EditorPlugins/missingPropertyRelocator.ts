import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { yamlRootStartOffset } from '../../../../../utils/schema/yamlPathLocator';
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
  // Whether a marker is anchored on the ROOT object (vs. a nested one, which
  // must stay in place). The default (column 1) is the plain-layout heuristic;
  // the live listener passes an AST-based line check that also tolerates
  // markers whose column drifted through edits (monaco tracks markers as
  // decorations, so edits on the anchor line can shift them off column 1).
  isRootAnchor: (m: MarkerRange) => boolean = (m) => m.startColumn === 1,
): T[] | null {
  const needsMove = (m: MarkerRange) =>
    MISSING_PROPERTY.test(m.message) &&
    isRootAnchor(m) &&
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

  // Root anchor: on the LINE the document's root node starts on (per the yaml
  // AST — tolerates markers shifted off column 1 by edits, since monaco moves
  // markers with the text), OR at column 1 (the plain heuristic; also matches
  // OUR already-relocated markers so they keep following a growing document).
  // Nested objects are indented and start on other lines: untouched.
  const rootOffset = yamlRootStartOffset(model.getValue());
  const rootLine = rootOffset != null ? model.getPositionAt(rootOffset).lineNumber : null;
  const isRootAnchor = (m: { startLineNumber: number; startColumn: number }) =>
    m.startColumn === 1 || (rootLine != null && m.startLineNumber === rootLine);

  // Markers are owned per validation source (monaco-yaml, yac-backend, ...);
  // rewrite within each owner group so no source's markers are dropped.
  const byOwner = new Map<string, monaco.editor.IMarker[]>();
  for (const marker of monaco.editor.getModelMarkers({ resource })) {
    const group = byOwner.get(marker.owner);
    if (group) group.push(marker);
    else byOwner.set(marker.owner, [marker]);
  }
  for (const [owner, markers] of byOwner) {
    const relocated = relocateMissingPropertyMarkers(
      markers,
      targetLine,
      targetMaxColumn,
      isRootAnchor,
    );
    // `null` = already in place; re-setting would re-fire the listener forever.
    if (relocated != null) {
      monaco.editor.setModelMarkers(model, owner, relocated);
    }
  }
}

/**
 * Rebuild the marker DECORATIONS when they no longer agree with the marker
 * data. Monaco stores markers as plain data but renders them through
 * decorations that move with text edits — a full-text replace (the pane sync's
 * `setValue`) clears or strands those decorations WITHOUT a marker event, and
 * monaco only rebuilds them when the markers change. The result in the field:
 * `getModelMarkers` correctly reports the relocated marker on the phantom last
 * line while the visible squiggle sits somewhere else entirely (or nowhere).
 * Detect the divergence (a squiggle on a line no marker occupies, or markers
 * without any squiggle) and force a rebuild by re-setting each owner's list.
 */
function repairStaleMarkerDecorations(model: monaco.editor.ITextModel) {
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  const severe = markers.filter((m) => m.severity >= monaco.MarkerSeverity.Warning);
  if (severe.length === 0) return;
  const markerLines = new Set(severe.map((m) => m.startLineNumber));

  const squiggles = model
    .getAllDecorations()
    .filter((d) => String(d.options.className ?? '').startsWith('squiggly'));
  const stale =
    squiggles.length === 0 || squiggles.some((d) => !markerLines.has(d.range.startLineNumber));
  if (!stale) return;

  const byOwner = new Map<string, monaco.editor.IMarker[]>();
  for (const marker of markers) {
    const group = byOwner.get(marker.owner);
    if (group) group.push(marker);
    else byOwner.set(marker.owner, [marker]);
  }
  for (const [owner, list] of byOwner) {
    // Clear + re-set: an identical single re-set may be treated as a no-op.
    monaco.editor.setModelMarkers(model, owner, []);
    monaco.editor.setModelMarkers(model, owner, list);
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
  // validation round-trip), and full-text replaces detach the rendered
  // squiggles from the marker data without any event. Re-assert both
  // periodically — the passes are a few compares and write nothing when
  // everything is in place.
  relocatorSafetyInterval = window.setInterval(() => {
    const model = ed.getModel();
    if (model == null) return;
    relocateForResource(model.uri);
    repairStaleMarkerDecorations(model);
  }, 500);
}
