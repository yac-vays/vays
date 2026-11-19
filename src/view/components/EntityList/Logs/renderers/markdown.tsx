import MarkdownRender from '../../../Markdown';
import LogWindow from './LogWindow';
import { GREY, ICONS, SymbolIcon, SymbolWarning } from './symbols';
import type { LogRenderer, LogViewProps } from './types';
import { LogContentStatus, useLogContent } from './useLogContent';
import WindowSubtitle from './WindowSubtitle';


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
        <div className="min-h-0 flex-1 overflow-y-auto text-plainfont">
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
    <>
      <SymbolIcon icon={ICONS.article} color={GREY} />
      {latest.problem === true && <SymbolWarning />}
    </>
  ),
  View: MarkdownView,
};
