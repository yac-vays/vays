import { useCallback, useEffect, useState } from 'react';
import {
  getEntityLogID,
  getEntityLogs,
  invalidateLogCache,
  subscribeLogRefresh,
} from '../../../../model/logs';
import { EntityLog, LogDecl } from '../../../../utils/types/api';
import { RequestContext } from '../../../../utils/types/internal/request';
import RichInfoPanel from '../../RichInfoPanel';
import LogPanel from './LogPanel';
import NoDataLog from './NoDataLog';
import { getLogRenderer } from './renderers';

// Size of a single log indicator (equal across log types). The row height is
// kept in line with log-less rows by trimming the cell's vertical padding in
// EntityListRow, not by shrinking the symbol — see the Logs <td> there.
const LOG_ITEM_CLASS = 'max-w-[44px] min-w-[34px] 2xl:max-w-[50px]';

// Base interval between two background polls of an entity's logs (a little
// random jitter is added so the rows don't all fire at once). Note that
// responses are cached (LOGS_CACHE_TTL), so not every poll hits the network.
const POLL_INTERVAL_MS = 10_000;

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
    // Resolves the sleep the poll loop is currently in (if any), so a refresh
    // request can cut the wait short.
    let wake: (() => void) | null = null;
    // A refresh request arrived while a fetch was running: fetch again right
    // after it, since the running one may predate the change.
    let refreshPending = false;
    // When the last fetch started (epoch ms); see LogRefreshRequest.since.
    let lastFetchStart = 0;

    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        const timer = setTimeout(() => {
          wake = null;
          res();
        }, ms);
        wake = () => {
          clearTimeout(timer);
          wake = null;
          res();
        };
      });

    const logID = getEntityLogID(entityName, requestContext);
    const unsubscribe = subscribeLogRefresh((request) => {
      if (request.logID !== null && request.logID !== logID) return;
      if (lastFetchStart >= request.since) return; // already done
      invalidateLogCache(entityName, requestContext);
      refreshPending = true;
      if (wake) wake(); // sleeping: fetch now; otherwise a fetch is running and repeats
    });

    (async () => {
      setIsLoading(true);
      let forced = true; // the initial load always fetches, even when hidden
      while (mounted) {
        if (
          !requestContext.accessedEntityType?.logs ||
          requestContext.accessedEntityType.logs.length == 0
        ) {
          return;
        }

        // Background polling is paused while the tab is not visible; explicit
        // refreshes (initial load, after an action, table reload) still run.
        if (!forced && document.hidden) {
          await sleep(POLL_INTERVAL_MS);
          forced = refreshPending;
          refreshPending = false;
          continue;
        }
        refreshPending = false;
        lastFetchStart = Date.now();

        const logs = await getEntityLogs(entityName, requestContext);
        if (!mounted) return;
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
        setIsLoading(false);

        if (refreshPending) {
          forced = true;
          continue;
        }
        await sleep(POLL_INTERVAL_MS + Math.round(2000 * Math.random()));
        // Woken by a refresh request (rather than the timer): fetch even if
        // the tab is hidden.
        forced = refreshPending;
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
      if (wake) wake();
    };
  }, [entityName]);
  return (
    <div
      className="flex flex-row flex-nowrap gap-1 px-1 py-0"
      style={{
        verticalAlign: 'middle',
        minWidth: Math.max(2, numLogElts) * 40,
      }}
    >
      {!requestContext.accessedEntityType?.logs ||
      requestContext.accessedEntityType.logs.length == 0 ? (
        <em className="opacity-80">No Logs Defined</em>
      ) : (
        requestContext.accessedEntityType.logs.map((decl) => (
          <div key={decl.name} className={LOG_ITEM_CLASS}>
            <LogSlot
              decl={decl}
              entries={logObject[decl.name] ?? []}
              loading={isLoading}
              entityName={entityName}
              requestContext={requestContext}
            />
          </div>
        ))
      )}
    </div>
  );
};

/**
 * One log of the entity: the indicator of its renderer and, on click, the
 * renderer's view (a popover next to it or a window). While loading, and for a
 * log without entries, every renderer looks the same.
 */
export const LogSlot = ({
  decl,
  entries,
  loading,
  entityName,
  requestContext,
}: {
  decl: LogDecl;
  entries: EntityLog[];
  loading: boolean;
  entityName: string;
  requestContext: RequestContext;
}) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Still fetching: the (non-clickable) spinner placeholder.
  if (loading) return <NoDataLog loading />;

  // No data: still openable, but the panel just states there are none.
  if (entries.length === 0) {
    return (
      <RichInfoPanel anchor={<NoDataLog loading={false} />}>
        <LogPanel title={decl.title} description={decl.description} logList={[]} />
      </RichInfoPanel>
    );
  }

  const renderer = getLogRenderer(decl);
  const indicator = (
    <div className="opacity-60">
      <renderer.Indicator decl={decl} latest={entries[0]} />
    </div>
  );
  const view = (
    <renderer.View
      decl={decl}
      entries={entries}
      entityName={entityName}
      requestContext={requestContext}
      onClose={close}
    />
  );

  if (renderer.display === 'popover') {
    return <RichInfoPanel anchor={indicator}>{view}</RichInfoPanel>;
  }
  return (
    <>
      <button
        type="button"
        className="block cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
        aria-haspopup="dialog"
        aria-label={decl.title}
        onClick={() => setOpen(true)}
      >
        {indicator}
      </button>
      {open && view}
    </>
  );
};

export default LogsField;
