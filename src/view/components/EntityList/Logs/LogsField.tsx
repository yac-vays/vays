import { useCallback, useEffect, useState } from 'react';
import {
  getEntityLogID,
  getEntityLogs,
  invalidateLogCache,
  subscribeLogRefresh,
} from '../../../../model/logs';
import { EntityLog, LogDecl } from '../../../../utils/types/api';
import { sortLatestFirst } from '../../../../utils/logUtils';
import { RequestContext } from '../../../../utils/types/internal/request';
import RichInfoPanel from '../../RichInfoPanel';
import LogPanel from './LogPanel';
import { getLogRenderer } from './renderers';
import { SYMBOL_SIZE, SymbolFrame, SymbolLoading, SymbolNone } from './renderers/symbols';

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

        // Background polls fail silently: one toast per row every few
        // seconds would not tell the user anything new.
        const logs = await getEntityLogs(entityName, requestContext, !forced);
        if (!mounted) return;
        // A failed fetch keeps the logs shown so far.
        if (logs !== null) {
          const log: { [key: string]: EntityLog[] } = {};

          for (const l of logs) {
            if (!log[l.name]) {
              log[l.name] = [];
            }
            log[l.name].push(l);
          }

          for (const key of Object.keys(log)) {
            log[key] = sortLatestFirst(log[key]);
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
  const logs = requestContext.accessedEntityType?.logs ?? [];
  return (
    // One group of squares, like the action buttons (separated by a hairline).
    <div
      className="flex flex-row flex-nowrap items-center gap-px"
      style={{ minWidth: Math.max(2, numLogElts) * (SYMBOL_SIZE + 1) }}
    >
      {logs.length == 0 ? (
        <em className="opacity-80">No Logs Defined</em>
      ) : (
        logs.map((decl, i) => (
          <LogSlot
            key={decl.name}
            decl={decl}
            entries={logObject[decl.name] ?? []}
            loading={isLoading}
            entityName={entityName}
            requestContext={requestContext}
            first={i === 0}
            last={i === logs.length - 1}
          />
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
  first = true,
  last = true,
}: {
  decl: LogDecl;
  entries: EntityLog[];
  loading: boolean;
  entityName: string;
  requestContext: RequestContext;
  /** Whether the symbol is the first / last of the group (rounded corners). */
  first?: boolean;
  last?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const frame = (title: string, content: React.ReactNode) => (
    <SymbolFrame first={first} last={last} title={title}>
      {content}
    </SymbolFrame>
  );

  // Still fetching: a (non-clickable) spinner.
  if (loading) return frame(decl.title, <SymbolLoading />);

  // No data: still openable, but the panel just states there are none.
  if (entries.length === 0) {
    return (
      <RichInfoPanel anchor={frame(`${decl.title}: no entries`, <SymbolNone />)}>
        <LogPanel title={decl.title} description={decl.description} logList={[]} />
      </RichInfoPanel>
    );
  }

  const renderer = getLogRenderer(decl);
  const latest = entries[0];
  const indicator = frame(
    latest.message ? `${decl.title}: ${latest.message}` : decl.title,
    <renderer.Indicator decl={decl} latest={latest} />,
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
