/**
 * Read-only Monaco viewer of the `document` log renderer. Loaded lazily (see
 * document.tsx), so the overview only pulls in Monaco once a document is
 * opened. Uses the expert mode's Monaco setup (workers, the YAML grammar, the
 * find widget and folding) and themes.
 */
import '../../../../pages/Edit/ExpertMode/monacoSetup';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import editorTheme from '../../../../pages/Edit/ExpertMode/EditorPlugins/theme';

export interface DocumentViewerHandle {
  /** Opens Monaco's find widget (also Ctrl/Cmd+F in the viewer). */
  find: () => void;
}

/** A language Monaco knows, else plain text. */
function knownLanguage(language: string): string {
  return monaco.languages.getLanguages().some((l) => l.id === language) ? language : 'plaintext';
}

const DocumentViewer = forwardRef<DocumentViewerHandle, { content: string; language: string }>(
  ({ content, language }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      find: () => {
        editorRef.current?.focus();
        editorRef.current?.getAction('actions.find')?.run();
      },
    }));

    useEffect(() => {
      if (containerRef.current == null) return;
      editorTheme();
      const model = monaco.editor.createModel(content, knownLanguage(language));
      const editor = monaco.editor.create(containerRef.current, {
        model,
        readOnly: true,
        domReadOnly: true,
        automaticLayout: true,
        theme: document.body.classList.contains('dark') ? 'vays-dark' : 'vays-light',
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        folding: true,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'none',
        padding: { top: 8 },
      });
      editorRef.current = editor;
      editor.focus();
      return () => {
        editorRef.current = null;
        editor.dispose();
        model.dispose();
      };
    }, [content, language]);

    return <div ref={containerRef} className="h-full w-full" data-testid="document-viewer" />;
  },
);
DocumentViewer.displayName = 'DocumentViewer';

export default DocumentViewer;
