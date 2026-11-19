import { lazy, Suspense } from 'react';
import LogWindow, { WindowButton } from './LogWindow';
import { GREY, ICONS, SymbolIcon, SymbolWarning } from './symbols';
import type { LogRenderer, LogViewProps } from './types';
import { LogContentStatus, useLogContent } from './useLogContent';
import WindowSubtitle from './WindowSubtitle';

const DocumentViewer = lazy(() => import('./DocumentViewer'));

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
  const { language } = documentOptions(decl.options);
  const content = state.kind === 'success' ? state.content : null;

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
        <WindowButton
          icon={ICON_DOWNLOAD}
          title="Download"
          disabled={content == null}
          onClick={download}
        />
      }
    >
      {content == null ? (
        <LogContentStatus state={state} retry={retry} />
      ) : (
        // Framed like the YAML editor of the edit page. Search: Ctrl/Cmd+F.
        <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-stroke">
          <Suspense fallback={<LogContentStatus state={{ kind: 'loading' }} retry={retry} />}>
            <DocumentViewer content={content.content} language={language} />
          </Suspense>
        </div>
      )}
    </LogWindow>
  );
};

/** `document`: a document (e.g. YAML) in a window, with highlighting, search (Ctrl+F) and download. */
export const documentRenderer: LogRenderer = {
  name: 'document',
  display: 'window',
  Indicator: ({ latest }) => (
    <>
      <SymbolIcon icon={ICONS.document} color={GREY} />
      {latest.problem === true && <SymbolWarning />}
    </>
  ),
  View: DocumentView,
};
