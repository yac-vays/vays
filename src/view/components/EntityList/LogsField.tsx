import { useEffect, useState } from 'react';
import { RequestContext } from '../../../controller/global/URLValidation';
import { EntityLog, getEntityLogs, isLogCached } from '../../../model/LogsFetcher';
import BoolLog from './LogSymbols/BoolLog';
import NumberLog from './LogSymbols/NumberLog';
import MessageLog from './LogSymbols/MessageLog';
import RichInfoPanel from '../RichInfoPanel';
import LogPanel from './LogPanel';

const LogsField = ({
  requestContext,
  entityName,
}: {
  requestContext: RequestContext;
  entityName: string;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [logObject, setLogObject] = useState<{ [key: string]: EntityLog[] }>({});
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

        if (!isLogCached(entityName, requestContext))
          await new Promise((res) =>
            setTimeout(res, Math.min(2000, 1000 + Math.round(2000 * Math.random()))),
          );

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
          setIsLoading(false);
          await new Promise((res) => setTimeout(res, 10_000 + Math.round(2000 * Math.random())));
        }
        setIsLoading(false);
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
                } 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px] opacity-60`}
              >
                <MessageLog loading={isLoading} />
              </div>,
            );
          }
        }
        return jsx;
      })()}
      {/* <CircularProgressbarWithChildren
value={90}
text={`${90}%`}
className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
styles={{
  root: {
    // maxWidth: minW,
    // maxHeight: minW,
    imageRendering: 'crisp-edges',
    transform: 'scale(1)',
  },
  path: { stroke: '#10B981' },
  text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
}}
>
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="opacity-40"
  height="70%"
  viewBox="0 -960 960 960"
  fill="#10B981"
>
  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
</svg>
</CircularProgressbarWithChildren>

<CircularProgressbarWithChildren
value={90}
text={`${90}%`}
className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
styles={{
  root: {
    // maxWidth: minW,
    // maxHeight: minW,
    imageRendering: 'crisp-edges',
    transform: 'scale(1)',
  },
  path: { stroke: '#DC3545' },
  text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
}}
>
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="opacity-40"
  height="70%"
  viewBox="0 -960 960 960"
  fill="#DC3545"
>
  <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
</svg>
</CircularProgressbarWithChildren>
<CircularProgressbarWithChildren
value={100}
className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
styles={{
  root: {
    // maxWidth: minW,
    // maxHeight: minW,
    imageRendering: 'crisp-edges',
    transform: 'scale(1)',
  },
  path: { stroke: '#DC3545' },
  text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
}}
>
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="opacity-80"
  height="70%"
  viewBox="0 -960 960 960"
  fill="#DC3545"
>
  <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
</svg>
</CircularProgressbarWithChildren>
<CircularProgressbarWithChildren
value={100}
className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
styles={{
  root: {
    // maxWidth: minW,
    // maxHeight: minW,
    imageRendering: 'crisp-edges',
    transform: 'scale(1)',
  },
  path: { stroke: '#10B981' },
  text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
}}
>
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="opacity-80"
  height="70%"
  viewBox="0 -960 960 960"
  fill="#10B981"
>
  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
</svg>
</CircularProgressbarWithChildren>

<CircularProgressbarWithChildren
// id="message"
value={100}
className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
styles={{
  root: {
    // maxWidth: minW,
    // maxHeight: minW,
    imageRendering: 'crisp-edges',
    verticalAlign: 'middle',
  },
  path: {
    stroke: `rgba(200, 200, 200)`,
  },
  text: { fontSize: 28, textRendering: 'optimizeLegibility' },
}}
>
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="opacity-50"
  height="60%"
  viewBox="0 -960 960 960"
  fill="grey"
>
  <path d="M480-680q-33 0-56.5-23.5T400-760q0-33 23.5-56.5T480-840q33 0 56.5 23.5T560-760q0 33-23.5 56.5T480-680Zm-60 560v-480h120v480H420Z" />
</svg>
</CircularProgressbarWithChildren> */}
    </div>
  );
};

export default LogsField;
