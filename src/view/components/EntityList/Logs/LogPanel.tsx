// import { useState } from 'react';
import { EntityLog } from '../../../../utils/types/api';
import { formatLogTime, formatRelativeTime } from '../../../../utils/logUtils';
import MarkdownRender from '../../Markdown';

const LogPanel = ({
  logList,
  title,
  description,
  showProgress,
}: {
  logList: EntityLog[];
  title: string;
  /** The log's description from the specs (markdown), shown below the title. */
  description?: string;
  /**
   * Whether this log type declares the progress feature (`TypeLog.progress`).
   * If so, every entry gets the percentage as the first column of the table.
   */
  showProgress?: boolean;
}) => {
  //   const [expand, setExpand] = useState<boolean>(false);
  return (
    // `w-max` sizes the panel to its widest line so short logs stay compact.
    // Chrome (border/background/shadow), the size cap and scrolling come from
    // the Popover the panel is rendered in (RichInfoPanel) — a second border
    // or a fixed max here would fight the viewport-aware clamping.
    <div className="relative w-max max-w-full">
      {/* <button className="absolute right-4 top-2">x</button> */}
      <div className="p-3">
        <h4 className="text-center text-title-sm font-bold text-solid hyphens-auto">{title}</h4>
        {description && (
          <div className="pt-1 px-2 text-sm text-reducedfont hyphens-auto">
            <MarkdownRender text={description} />
          </div>
        )}
      </div>
      <div className="max-w-3xl mx-auto p-4">
        <div className="space-y-4">
          {logList.length === 0 && (
            <em className="block text-center opacity-70">No log entries.</em>
          )}
          {(function () {
            const jsx = [];
            let i = 0;
            for (const logEntry of logList) {
              // Show a compact "time ago"; on hover reveal the absolute date. If
              // the timestamp can't be parsed, show the raw string as-is.
              const relative = formatRelativeTime(logEntry.time);
              const timeDisplay = relative ?? (logEntry.time || 'No time available');
              const timeTitle = relative ? formatLogTime(logEntry.time) : undefined;
              jsx.push(
                <div key={i++} className="flex gap-2">
                  {/* Percentage first, for log types with the progress
                      feature. Entries without a value get a dimmed dash.
                      Lighter than the message (like the time column) so the
                      two are easy to tell apart; wide enough for "100%" and
                      nowrap so it never line-breaks. */}
                  {showProgress && (
                    <div className="w-12 shrink-0 text-right tabular-nums whitespace-nowrap text-sm text-gray-500 opacity-70">
                      {logEntry.progress != null ? (
                        `${logEntry.progress}%`
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </div>
                  )}
                  {/* Message on the left. */}
                  <div className="p-2 pt-0 rounded-md text-gray-800 flex-1 dark:text-white">
                    <p>{logEntry.message}</p>
                  </div>
                  {/* Relative time on the right. */}
                  <div className="text-gray-500 shrink-0 text-right" title={timeTitle}>
                    <span className="block text-sm opacity-70 whitespace-nowrap">{timeDisplay}</span>
                  </div>
                </div>,
              );
            }

            return jsx;
          })()}
        </div>
      </div>
    </div>
  );
};

export default LogPanel;
