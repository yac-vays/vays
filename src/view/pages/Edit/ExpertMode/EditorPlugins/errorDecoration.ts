import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { RequestEditContext } from '../../../../../utils/types/internal/request';

// The markers listener is global (monaco-level, not editor-level); keep the
// IDisposable so the editor teardown can dispose it (see Editor.tsx cleanup).
let markersListener: monaco.IDisposable | null = null;

export function disposeErrorMarkersListener() {
  markersListener?.dispose();
  markersListener = null;
}

export default async function editorErrorDecoration(
  ed: monaco.editor.IStandaloneCodeEditor,
  _: RequestEditContext,
  reInvoked: boolean = false,
) {
  if (reInvoked) return;
  // Never stack listeners: the previous editor's listener (if any) is gone.
  disposeErrorMarkersListener();
  const decorations = ed.createDecorationsCollection([]);

  markersListener = monaco.editor.onDidChangeMarkers(([resource]) => {
    const markers = monaco.editor.getModelMarkers({ resource });
    const decs: monaco.editor.IModelDeltaDecoration[] = [];
    for (const marker of markers) {
      if (marker.severity === monaco.MarkerSeverity.Hint) {
        continue;
      }
      decs.push({
        range: new monaco.Range(
          marker.startLineNumber,
          marker.startColumn,
          marker.endLineNumber,
          marker.endColumn,
        ),
        options: {
          isWholeLine: false,
          className: 'error-line',
          glyphMarginClassName: 'error-glyph',
          glyphMarginHoverMessage: {
            isTrusted: true,
            supportHtml: true,
            supportThemeIcons: true,
            uris: undefined,
            value:
              marker.message +
              ` <span style="color:#aaaaaa;">[${marker.startColumn}, ${marker.endColumn}]</span>`,
            // https://stackoverflow.com/questions/70539772/monaco-editor-how-to-properly-use-hovers-imarkdownstring-with-html
          },
        },
      });
    }

    decorations.set(decs);
  });
}
