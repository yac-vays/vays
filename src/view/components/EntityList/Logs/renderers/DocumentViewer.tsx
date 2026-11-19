/**
 * Read-only Monaco viewer of the `document` log renderer. Loaded lazily (see
 * document.tsx), so the overview only pulls in Monaco once a document is
 * opened. Uses the expert mode's Monaco setup (workers, the YAML grammar, the
 * find widget and folding) and themes.
 */
import '../../../../pages/Edit/ExpertMode/monacoSetup';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect, useRef } from 'react';
import editorTheme from '../../../../pages/Edit/ExpertMode/EditorPlugins/theme';

/** A language Monaco knows, else plain text. */
function knownLanguage(language: string): string {
  return monaco.languages.getLanguages().some((l) => l.id === language) ? language : 'plaintext';
}

/** The document, read-only; Ctrl/Cmd+F opens Monaco's find widget. */
const DocumentViewer = ({ content, language }: { content: string; language: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    editor.focus();
    return () => {
      editor.dispose();
      model.dispose();
    };
  }, [content, language]);

  return <div ref={containerRef} className="h-full w-full" data-testid="document-viewer" />;
};

export default DocumentViewer;
