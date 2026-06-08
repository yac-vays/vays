import { diffLines } from 'diff';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Computes Monaco decorations that highlight how the current YAML differs from
 * the *original* entity YAML (the version fetched when the editing session
 * started): added / changed lines get a green background + gutter bar, and the
 * points where lines were removed get a marker in the glyph margin.
 *
 * The baseline is empty in create mode, so the whole document reads as "new".
 * This is a pure function; the wiring (recompute on every change) lives in the
 * Editor component so it follows the editor's lifecycle.
 */

/** Number of lines a jsdiff chunk spans. */
function lineCount(part: { count?: number; value: string }): number {
  if (typeof part.count === 'number') return part.count;
  const v = part.value;
  if (!v) return 0;
  return v.split('\n').length - (v.endsWith('\n') ? 1 : 0);
}

export function computeDiffDecorations(
  baseline: string,
  current: string,
): monaco.editor.IModelDeltaDecoration[] {
  const decs: monaco.editor.IModelDeltaDecoration[] = [];
  if (current === baseline) return decs;

  const parts = diffLines(baseline ?? '', current ?? '');
  let line = 1;

  for (const part of parts) {
    const count = lineCount(part);
    if (part.added) {
      if (count > 0) {
        decs.push({
          range: new monaco.Range(line, 1, line + count - 1, 1),
          options: {
            isWholeLine: true,
            className: 'diff-added-line',
            linesDecorationsClassName: 'diff-added-gutter',
          },
        });
      }
      line += count;
    } else if (part.removed) {
      // Removed lines do not exist in the current document; flag the line that
      // now sits at the removal point so the deletion is still visible.
      const markerLine = Math.max(1, line);
      decs.push({
        range: new monaco.Range(markerLine, 1, markerLine, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'diff-removed-glyph',
          glyphMarginHoverMessage: { value: 'Line(s) removed here compared to the original.' },
        },
      });
      // Do not advance: removed content occupies no line in the current doc.
    } else {
      line += count;
    }
  }

  return decs;
}
