import MarkdownRender from '../../../Markdown';
import LogWindow from './LogWindow';
import SymbolIndicator from './SymbolIndicator';
import type { LogRenderer, LogViewProps } from './types';
import { LogContentStatus, useLogContent } from './useLogContent';
import WindowSubtitle from './WindowSubtitle';

const ICON_ARTICLE =
  'M280-280h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z';

const MarkdownView = ({ decl, entries, entityName, requestContext, onClose }: LogViewProps) => {
  const [state, retry] = useLogContent(entityName, decl.name, requestContext);
  const content = state.kind === 'success' ? state.content : null;

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
      size="content"
      onClose={onClose}
    >
      {content == null ? (
        <LogContentStatus state={state} retry={retry} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-solid">
          <MarkdownRender text={content.content} />
        </div>
      )}
    </LogWindow>
  );
};

/** `markdown`: a Markdown text (e.g. a how-to for the entity) in a window. */
export const markdownRenderer: LogRenderer = {
  name: 'markdown',
  display: 'window',
  Indicator: ({ latest }) => (
    <SymbolIndicator symbol={ICON_ARTICLE} problem={latest.problem} label={latest.message} />
  ),
  View: MarkdownView,
};
