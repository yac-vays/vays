import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {
  nestedObjectAnchors,
  yamlRootStartOffset,
} from '../../../../../utils/schema/yamlPathLocator';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

/**
 * monaco-yaml anchors a "Missing property" diagnostic on the line that
 * introduces the object lacking the property: the KEY of an object that is a
 * map entry's value (`key:` + nested entries), the object's own first
 * property for list elements (`- ip: x`). Only the ROOT object has no such
 * line — its anchor visually lands on the FIRST property of the document,
 * which has nothing to do with the error. This plugin relocates root-level
 * markers to the (phantom) last line of the document, where the user would
 * add the property; all others stay where monaco-yaml put them.
 *
 * Root-level markers are recognized by sitting at column 1 / on the root's
 * first line — which also holds for the key of a TOP-LEVEL nested object.
 * Those are told apart by matching the key exactly (see `nestedObjectAnchors`);
 * otherwise a nested object's missing property would land on the document end
 * and read as a missing top-level property.
 */

/** monaco-yaml's fixed wording for a violated `required` (VAYS does not localize). */
const MISSING_PROPERTY = /^Missing property "(.+)"\.$/;

/** The marker fields the relocation rewrites. */
export interface MarkerRange {
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export type MarkerPlacement = Omit<MarkerRange, 'message'>;

/** The property a monaco-yaml "Missing property" marker reports, or null. */
export function missingPropertyName(message: string): string | null {
  return MISSING_PROPERTY.exec(message)?.[1] ?? null;
}

/**
 * Rewrite every missing-property marker for which `placementOf` returns a
 * placement (null = leave it where it is). Returns null when nothing needed to
 * change — the caller MUST then not re-set the markers, otherwise the
 * resulting marker-change event would loop forever.
 */
export function relocateMissingPropertyMarkers<T extends MarkerRange>(
  markers: T[],
  placementOf: (m: T, property: string) => MarkerPlacement | null,
): T[] | null {
  const moves = markers.map((m) => {
    const property = missingPropertyName(m.message);
    const p = property == null ? null : placementOf(m, property);
    const moved =
      p != null &&
      (m.startLineNumber !== p.startLineNumber ||
        m.startColumn !== p.startColumn ||
        m.endLineNumber !== p.endLineNumber ||
        m.endColumn !== p.endColumn);
    return moved ? p : null;
  });
  if (moves.every((p) => p == null)) return null;
  return markers.map((m, i) => (moves[i] ? { ...m, ...moves[i] } : m));
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

/** The slice of monaco's ITextModel the placement needs (fakeable in tests). */
export interface PlacementModel {
  getValue(): string;
  getLineCount(): number;
  getLineMaxColumn(lineNumber: number): number;
  getPositionAt(offset: number): { lineNumber: number; column: number };
  getOffsetAt(position: { lineNumber: number; column: number }): number;
}

/**
 * The placement function for `relocateMissingPropertyMarkers` on the model's
 * current text: where the "Missing property" marker `m` belongs, or null to
 * leave it alone.
 */
export function missingPropertyPlacer(
  model: PlacementModel,
): (m: MarkerRange, property: string) => MarkerPlacement | null {
  const text = model.getValue();
  const targetLine = model.getLineCount();
  const rootPlacement: MarkerPlacement = {
    startLineNumber: targetLine,
    startColumn: 1,
    endLineNumber: targetLine,
    endColumn: model.getLineMaxColumn(targetLine),
  };

  // Root anchor: on the LINE the document's root node starts on (per the yaml
  // AST — tolerates markers shifted off column 1 by edits, since monaco moves
  // markers with the text), OR at column 1 (the plain heuristic; also matches
  // OUR already-relocated markers so they keep following a growing document).
  const rootOffset = yamlRootStartOffset(text);
  const rootLine = rootOffset != null ? model.getPositionAt(rootOffset).lineNumber : null;
  const isRootAnchor = (m: MarkerRange) =>
    m.startColumn === 1 || (rootLine != null && m.startLineNumber === rootLine);

  const anchors = nestedObjectAnchors(text);

  return (m, property) => {
    const start = model.getOffsetAt({ lineNumber: m.startLineNumber, column: m.startColumn });
    const end = model.getOffsetAt({ lineNumber: m.endLineNumber, column: m.endColumn });
    // On the key of a nested object lacking the property: already in place
    // (checked first — a top-level key passes the root heuristic too).
    const onNestedKey = anchors.some(
      (a) => a.key.start === start && a.key.end === end && !a.keys.includes(property),
    );
    if (onNestedKey) return null;
    return isRootAnchor(m) ? rootPlacement : null;
  };
}

/** Run one relocation pass for the model behind `resource` (no-op when clean). */
function relocateForResource(resource: monaco.Uri) {
  const model = monaco.editor.getModel(resource);
  if (model == null) return;
  const all = monaco.editor.getModelMarkers({ resource });
  // Most passes (safety interval!) have nothing to do: skip the yaml parses.
  if (!all.some((m) => missingPropertyName(m.message) != null)) return;
  const placementOf = missingPropertyPlacer(model);

  // Markers are owned per validation source (monaco-yaml, yac-backend, ...);
  // rewrite within each owner group so no source's markers are dropped.
  const byOwner = new Map<string, monaco.editor.IMarker[]>();
  for (const marker of all) {
    const group = byOwner.get(marker.owner);
    if (group) group.push(marker);
    else byOwner.set(marker.owner, [marker]);
  }
  for (const [owner, markers] of byOwner) {
    const relocated = relocateMissingPropertyMarkers(markers, placementOf);
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
