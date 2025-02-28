// import { useState } from 'react';
import { EntityLog } from '../../../../utils/types/api';

const LogPanel = ({ logList, title }: { logList: EntityLog[]; title: string }) => {
  //   const [expand, setExpand] = useState<boolean>(false);
  return (
    <div className="relative border z-99 rounded ml-3 w-max max-w-[350px] max-h-[500px] overflow-y-auto bg-bg drop-shadow-xl">
      {/* <button className="absolute right-4 top-2">x</button> */}
      <div className="p-3">
        <h4 className="text-center text-title-sm font-bold text-solid hyphens-auto">{title}</h4>
      </div>
      <div className="max-w-3xl mx-auto p-4">
        <div className="space-y-4">
          {(function () {
            const jsx = [];
            for (const logEntry of logList) {
              jsx.push(
                <div className="flex">
                  <div className="text-gray-500 w-32">
                    <span className="block text-sm opacity-70">
                      {logEntry.time
                        ? new Date(Date.parse(logEntry.time)).toLocaleString()
                        : 'No time available'}
                    </span>
                  </div>
                  {/* Doing it the trigger way. Not gonna define a new color for this single usecase. */}
                  <div className="p-2 pt-0 rounded-md text-gray-800 flex-1 dark:text-white">
                    <p>{logEntry.message}</p>
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
