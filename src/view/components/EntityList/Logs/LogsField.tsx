import { useEffect, useState } from 'react';
import { getEntityLogs, isLogCached } from '../../../../model/logs';
import { EntityLog } from '../../../../utils/types/api';
import { RequestContext } from '../../../../utils/types/internal/request';
import RichInfoPanel from '../../RichInfoPanel';
import BoolLog from './BoolLog';
import LogPanel from './LogPanel';
import MessageLog from './MessageLog';
import NumberLog from './NumberLog';

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
      className={`flex flex-row xl:flex-wrap 2xl:flex-nowrap gap-1 w-full p-1 min-w-[${
        Math.max(2, numLogElts) * 60
      }px] xl:min-w-[0px]`}
      style={{
        verticalAlign: 'middle',
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
          if (l.problem && !l.progress) {
            jsx.push(
              <div
                className={`${
                  numLogElts == 2 ? 'xl:max-w-[42px]' : 'xl:max-w-[38px]'
                } 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]`}
              >
                {!hasLogs ? (
                  <div className="opacity-60">
                    <BoolLog problem={problem} loading={isLoading} />
                  </div>
                ) : (
                  <RichInfoPanel
                    anchor={
                      <div className="opacity-60">
                        <BoolLog problem={problem} loading={isLoading} />
                      </div>
                    }
                  >
                    <LogPanel title={l.title} logList={logObject[l.name]} />
                  </RichInfoPanel>
                )}
              </div>,
            );
          } else if (l.progress) {
            jsx.push(
              <div
                className={`${
                  numLogElts == 2 ? 'xl:max-w-[42px]' : 'xl:max-w-[38px]'
                } 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]`}
              >
                {!hasLogs ? (
                  <div className="opacity-60">
                    <NumberLog problem={problem} progress={progress} loading={isLoading} />
                  </div>
                ) : (
                  <RichInfoPanel
                    anchor={
                      <div className="opacity-60">
                        <NumberLog problem={problem} progress={progress} loading={isLoading} />
                      </div>
                    }
                  >
                    <LogPanel title={l.title} logList={logObject[l.name]} />
                  </RichInfoPanel>
                )}
              </div>,
            );
          } else {
            jsx.push(
              <div
                className={`${
                  numLogElts == 2 ? 'xl:max-w-[42px]' : 'xl:max-w-[38px]'
                } 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]`}
              >
                {!hasLogs ? (
                  <div className="opacity-60">
                    <MessageLog loading={isLoading} hasLogs={hasLogs} />
                  </div>
                ) : (
                  <RichInfoPanel
                    anchor={
                      <div className="opacity-60">
                        <MessageLog loading={isLoading} hasLogs={hasLogs} />
                      </div>
                    }
                  >
                    <LogPanel title={l.title} logList={logObject[l.name]} />
                  </RichInfoPanel>
                )}
              </div>,
            );
          }
        }
        return jsx;
      })()}
    </div>
  );
};

export default LogsField;
