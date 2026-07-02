import { useEffect, useState } from 'react';
import { getEntityLogs, isLogCached } from '../../../../model/logs';
import { EntityLog } from '../../../../utils/types/api';
import { RequestContext } from '../../../../utils/types/internal/request';
import RichInfoPanel from '../../RichInfoPanel';
import BoolLog from './BoolLog';
import LogPanel from './LogPanel';
import MessageLog from './MessageLog';
import NoDataLog from './NoDataLog';
import NumberLog from './NumberLog';

// Size of a single log indicator (equal across log types). The row height is
// kept in line with log-less rows by trimming the cell's vertical padding in
// EntityListRow, not by shrinking the symbol — see the Logs <td> there.
const LOG_ITEM_CLASS = 'max-w-[44px] min-w-[34px] 2xl:max-w-[50px]';

const LogsField = ({
  requestContext,
  entityName,
}: {
  requestContext: RequestContext;
  entityName: string;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [logObject, setLogObject] = useState<{
    [key: string]: EntityLog[];
  }>({});
  const [numLogElts, setNumLogElts] = useState<number>(
    !requestContext.accessedEntityType?.logs ? 0 : requestContext.accessedEntityType.logs.length,
  );
  useEffect(() => {
    setNumLogElts(
      !requestContext.accessedEntityType?.logs ? 0 : requestContext.accessedEntityType.logs.length,
    );
  }, [requestContext.entityTypeName, requestContext.yacURL]);
  useEffect(() => {
    let mounted = true;
    let firstIteration = true;

    (async () => {
      while (true) {
        if (firstIteration) {
          firstIteration = false;
          setIsLoading(true);
        }

        if (!firstIteration && !isLogCached(entityName, requestContext)) {
          await new Promise((res) =>
            setTimeout(res, Math.min(2000, 1000 + Math.round(2000 * Math.random()))),
          );
          // if the tab is not active, then do not actually request the logs.
          if (document.hidden) {
            continue;
          }
        }

        if (!mounted) {
          return;
        }

        if (
          !requestContext.accessedEntityType?.logs ||
          requestContext.accessedEntityType.logs.length == 0
        ) {
          return;
        }
        const logs = await getEntityLogs(entityName, requestContext);
        if (logs === null) {
          setLogObject({});
        } else {
          const log: { [key: string]: EntityLog[] } = {};

          for (const l of logs) {
            if (!log[l.name]) {
              log[l.name] = [];
            }
            log[l.name].push(l);
          }

          for (const key of Object.keys(log)) {
            log[key].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          }
          setLogObject(log);
        }
        if (!mounted) {
          return;
        }
        setIsLoading(false);
        await new Promise((res) => setTimeout(res, 10_000 + Math.round(2000 * Math.random())));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [entityName]);
  // opacity-60
  return (
    <div
      className="flex flex-row xl:flex-wrap 2xl:flex-nowrap gap-1 px-1 py-0 xl:!min-w-0"
      style={{
        verticalAlign: 'middle',
        minWidth: Math.max(2, numLogElts) * 40,
      }}
    >
      {(function () {
        const jsx = [];
        if (
          !requestContext.accessedEntityType?.logs ||
          requestContext.accessedEntityType.logs.length == 0
        ) {
          return <em className="opacity-80">No Logs Defined</em>;
        }
        for (const l of requestContext.accessedEntityType.logs) {
          let problem = null;
          let progress = null;
          const hasLogs = logObject[l.name] && logObject[l.name].length > 0;
          if (hasLogs) {
            problem = logObject[l.name][0].problem ?? null;
            progress = logObject[l.name][0].progress ?? null;
          }

          // The indicator shown once the log actually has data depends on the
          // log's declared type. When there is no data, every type falls back to
          // the same neutral placeholder (grey ring + question mark).
          let indicator;
          if (l.problem && !l.progress) {
            indicator = <BoolLog problem={problem} loading={isLoading} />;
          } else if (l.progress) {
            indicator = <NumberLog problem={problem} progress={progress} loading={isLoading} />;
          } else {
            indicator = <MessageLog loading={isLoading} hasLogs={hasLogs} />;
          }

          jsx.push(
            <div key={l.name} className={LOG_ITEM_CLASS}>
              {isLoading ? (
                // Still fetching: show the (non-clickable) spinner placeholder.
                <NoDataLog loading />
              ) : hasLogs ? (
                <RichInfoPanel anchor={<div className="opacity-60">{indicator}</div>}>
                  <LogPanel
                    title={l.title}
                    description={l.description}
                    logList={logObject[l.name]}
                    showProgress={l.progress}
                  />
                </RichInfoPanel>
              ) : (
                // No data: still openable, but the panel just states there are none.
                <RichInfoPanel anchor={<NoDataLog loading={false} />}>
                  <LogPanel
                    title={l.title}
                    description={l.description}
                    logList={[]}
                    showProgress={l.progress}
                  />
                </RichInfoPanel>
              )}
            </div>,
          );
        }
        return jsx;
      })()}
    </div>
  );
};

export default LogsField;
