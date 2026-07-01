// import { useState } from 'react';
import { EntityLog } from '../../../../utils/types/api';
import { formatLogTime, formatRelativeTime } from '../../../../utils/logUtils';

const LogPanel = ({ logList, title }: { logList: EntityLog[]; title: string }) => {
  //   const [expand, setExpand] = useState<boolean>(false);
  return (
    // `w-max` sizes the panel to its widest line so short logs stay compact, while
    // `max-w-[640px]` caps it for long messages (which then wrap).
    <div className="relative border z-99 rounded ml-3 w-max max-w-[640px] max-h-[500px] overflow-y-auto bg-bg drop-shadow-xl">
      {/* <button className="absolute right-4 top-2">x</button> */}
      <div className="p-3">
        <h4 className="text-center text-title-sm font-bold text-solid hyphens-auto">{title}</h4>
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
