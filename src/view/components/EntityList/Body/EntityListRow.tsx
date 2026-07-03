import { ReactNode, useEffect, useRef } from 'react';
import 'react-circular-progressbar/dist/styles.css';
import { buildOverviewHighlightURL, navigateToURL } from '../../../../controller/global/url';
import { hasLogsDefined } from '../../../../utils/logUtils';
import { ActionsColumnResults } from '../../../../utils/types/internal/actions';
import { OverviewListCellEntry } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import ActionDropdown from '../../ActionDropdown';
import ActionButton from '../../Buttons/ActionButton';
import MarkdownRender from '../../Markdown';
import LogsField from '../Logs/LogsField';

interface EntityListRow {
  entryValues: OverviewListCellEntry[];
  requestContext: RequestContext;
  link: Nullable<string>;
  actionPair: ActionsColumnResults;
  entityName: string;
  highlight?: boolean;
  scroll?: boolean;
}

const EntityListRow = ({
  entryValues,
  requestContext,
  link,
  actionPair,
  entityName,
  highlight = false,
  scroll = false,
}: EntityListRow) => {
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Scroll into view only when we actually paged to this entity (not when it
  // was already visible). The highlight tint is handled separately below.
  useEffect(() => {
    if (scroll && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scroll, entityName]);

  // Navigate to the overview pointing at a given entity (highlights/scrolls to it).
  const goToEntity = (name: string) =>
    navigateToURL(
      buildOverviewHighlightURL(
        requestContext.backendObject?.name,
        requestContext.entityTypeName,
        name,
      ),
    );

  // Renders the content of a data cell. The first column is the entity name and
  // is made clickable to put it in the URL (and thus highlight this row).
  const renderCellContent = (entry: OverviewListCellEntry, i: number): ReactNode => {
    if (i === 0) {
      return (
        <span
          className="cursor-pointer hover:underline"
          title={`Highlight ${entityName}`}
          onClick={() => goToEntity(entityName)}
        >
          {entry.value}
        </span>
      );
    }
    if (entry.value === '(None)') return <em className="opacity-50">None</em>;
    if (entry.isMarkdown) return <MarkdownRender text={entry.value} />;
    return entry.value;
  };

  return (
    <>
      <tr
        ref={rowRef}
        className={`border-t border-stroke hover:bg-primary-5 ${
          highlight ? 'entity-row-highlight' : ''
        }`}
        role="row"
        title={link ? 'Link to ' + link : undefined}
      >
        {(function fillRow() {
          const jsx = [];

          // The trailing placeholder entries are 'Actions' and, only when the
          // entity type defines logs, 'Status'. Skip them in the data-column loop.
          const showLogs = hasLogsDefined(requestContext);
          const numTrailingCols = showLogs ? 2 : 1;

          for (let i = 0; i < entryValues.length - numTrailingCols; i++) {
            const entry = entryValues[i];
            if (link) {
              jsx.push(
                // TODO: Make this a bit more elegant, avoid such hard coded flags.
                <td
                  key={`col-${i}`}
                  className="pl-8:first-child border-stroke opacity-40"
                  style={{ paddingRight: 40 }}
                  role="cell"
                >
                  {renderCellContent(entry, i)}
                  {i == 0 && link ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-current inline pl-2 cursor-pointer"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      onClick={() => goToEntity(link)}
                    >
                      <title>{`Link to ${link}`}</title>
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                    </svg>
                  ) : (
                    <></>
                  )}
                </td>,
              );
              continue;
            }
            jsx.push(
              // TODO: Make this a bit more elegant, avoid such hard coded flags.
              <td
                key={`col-${i}`}
                className="pl-8:first-child border-stroke"
                style={{ paddingRight: 40 }}
                role="cell"
              >
                {renderCellContent(entry, i)}
              </td>,
            );
          }
          if (showLogs) {
            jsx.push(
              <td
                key="logs"
                className="pl-8:first-child border-stroke"
                // `width:1px` makes the auto-layout table shrink this column to its
                // content (the indicator row) instead of stretching it and leaving a
                // large empty gap on the right. `paddingRight` gives the icons a
                // modest gap before the Actions column. The reduced vertical padding
                // (vs the table's default 1.25rem) offsets the larger symbols so the
                // row stays as tall as a log-less row.
                style={{ width: '1px', paddingRight: 24, paddingTop: 8, paddingBottom: 8 }}
                role="cell"
              >
                <LogsField requestContext={requestContext} entityName={entityName} />
              </td>,
            );
          }
          jsx.push(
            <td key="actions" className="border-stroke" style={{ width: '1px', whiteSpace: 'nowrap' }}>
              {/* overflow:"hidden" */}
              {/* The buttons stacking up version...*/}
              {/* <div className="flex flex-col items-center" style={{width:"100%"}}>
                                <div className="group relative items-center" style={{width:"100%"}}> */}
              {/* Buttons and the dropdown trigger staying together on one line. */}
              <div className="items-center flex flex-row">
                {(function () {
                  const jsx: ReactNode[] = [];
                  let isLeft = true;
                  for (const act of actionPair.favActs) {
                    jsx.push(<ActionButton key={act.action.name} actArgs={act} isLeft={isLeft} />);
                    isLeft = false;
                    // TODO: using pseudoclass?
                  }
                  return jsx;
                })()}
                {actionPair.dropdownActs.length > 0 ? (
                  <ActionDropdown entityName={entityName} actions={actionPair.dropdownActs} />
                ) : (
                  <></>
                )}
              </div>
            </td>,
          );
          return jsx;
        })()}
      </tr>
    </>
  );
};

export default EntityListRow;
