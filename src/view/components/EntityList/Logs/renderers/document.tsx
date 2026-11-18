import { lazy, Suspense, useRef, useState } from 'react';
import LogWindow, { WINDOW_BUTTON_CLASS, WindowIcon } from './LogWindow';
import SymbolIndicator from './SymbolIndicator';
import type { LogRenderer, LogViewProps } from './types';
import { LogContentStatus, useLogContent } from './useLogContent';
import WindowSubtitle from './WindowSubtitle';
import type { DocumentViewerHandle } from './DocumentViewer';

const DocumentViewer = lazy(() => import('./DocumentViewer'));

const ICON_DOCUMENT =
  'M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z';
const ICON_SEARCH =
  'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z';
const ICON_COPY =
  'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z';
const ICON_DOWNLOAD =
  'M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z';

/** File extensions for the download, by language. */
const EXTENSIONS: Record<string, string> = {
  yaml: 'yaml',
  json: 'json',
  markdown: 'md',
  xml: 'xml',
  ini: 'ini',
  shell: 'sh',
};

/** The options of the `document` renderer (see the docs). */
export function documentOptions(options: Record<string, unknown>) {
  const language = typeof options.language === 'string' ? options.language : 'plaintext';
  const filename = typeof options.filename === 'string' ? options.filename : null;
  return { language, filename };
}

export function downloadFilename(
  entityName: string,
  logName: string,
  options: Record<string, unknown>,
): string {
  const { language, filename } = documentOptions(options);
  if (filename) return filename.replaceAll('{name}', entityName);
  return `${entityName}-${logName}.${EXTENSIONS[language] ?? 'txt'}`;
}

const DocumentView = ({ decl, entries, entityName, requestContext, onClose }: LogViewProps) => {
  const [state, retry] = useLogContent(entityName, decl.name, requestContext);
  const [copied, setCopied] = useState(false);
  const viewerRef = useRef<DocumentViewerHandle>(null);
  const { language } = documentOptions(decl.options);
  const content = state.kind === 'success' ? state.content : null;

  const copy = () => {
    if (content == null) return;
    navigator.clipboard.writeText(content.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const download = () => {
    if (content == null) return;
    const url = URL.createObjectURL(new Blob([content.content], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename(entityName, decl.name, decl.options);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <LogWindow
      title={decl.title}
      description={decl.description}
      subtitle={
        <WindowSubtitle
          entityName={entityName}
          time={content?.time || entries[0]?.time || ''}
          latest={entries[0]}
        />
      }
      onClose={onClose}
      toolbar={
        <>
          <button
            type="button"
            className={WINDOW_BUTTON_CLASS}
            disabled={content == null}
            onClick={() => viewerRef.current?.find()}
            title="Search (Ctrl+F)"
          >
            <WindowIcon path={ICON_SEARCH} /> Search
          </button>
          <button
            type="button"
            className={WINDOW_BUTTON_CLASS}
            disabled={content == null}
            onClick={copy}
          >
            <WindowIcon path={ICON_COPY} /> {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className={WINDOW_BUTTON_CLASS}
            disabled={content == null}
            onClick={download}
          >
            <WindowIcon path={ICON_DOWNLOAD} /> Download
          </button>
        </>
      }
    >
      {content == null ? (
        <LogContentStatus state={state} retry={retry} />
      ) : (
        <Suspense fallback={<LogContentStatus state={{ kind: 'loading' }} retry={retry} />}>
          <DocumentViewer ref={viewerRef} content={content.content} language={language} />
        </Suspense>
      )}
    </LogWindow>
  );
};

/** `document`: a document (e.g. YAML) in a window, with highlighting and search. */
export const documentRenderer: LogRenderer = {
  name: 'document',
  display: 'window',
  Indicator: ({ latest }) => (
    <SymbolIndicator symbol={ICON_DOCUMENT} problem={latest.problem} label={latest.message} />
  ),
  View: DocumentView,
};
