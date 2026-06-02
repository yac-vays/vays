import { useEffect, useRef, useState } from 'react';
import {
  fetchEntities,
  getEntityPage,
  getHeaderEntries,
} from '../../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';

export function useInitializeList(requestContext: RequestContext, targetEntityName?: string) {
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [tableEntries, setTableEntries] = useState<QueryResult[]>([]);
  //const tableEntries = useRef<QueryResult[]>([]);
  const [tableHeaderEntries, setTableHeaderEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerms, setSearchTerms] = useState<(string | null)[]>([]);
  // The entity to scroll to. Only set when we actually (re)load/page to it, so
  // that simply highlighting an already-visible entity does not scroll.
  const [scrollTargetName, setScrollTargetName] = useState<string | undefined>(undefined);

  // Query Level information
  const [currPage, setCurrPage] = useState<number>(1);
  const [numResultsPerPage, setNumResultsPerPage] = useState<number>(50);
  const [totalNumResults, setTotalNumResults] = useState<number>(10);

  // Always-current view of the entries / data identity, read inside the effect
  // without making them dependencies (which would cause unwanted reloads).
  const latestEntriesRef = useRef<QueryResult[]>(tableEntries);
  latestEntriesRef.current = tableEntries;
  const prevDataKeyRef = useRef<string>('');

  useEffect(() => {
    let mounted = true;
    /**
     * Race condition prevention.
     * https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect
     * 2 Raceconditions to worry here, multi loading and cross loading
     * Good practices here
     *   https://devtrium.com/posts/async-functions-useeffect#what-if-you-need-to-extract-the-function-outside-useeffect
     *   https://www.digitalocean.com/community/tutorials/how-to-handle-async-data-loading-lazy-loading-and-code-splitting-with-react
     * Note this callback is executed in a closure, which is opened up for the change triggers
     **/

    (async function () {
      if (requestContext.accessedEntityType?.options == undefined) {
        setTableHeaderEntries([]);
        return;
      }

      // Did the underlying data (type/backend/page size/explicit reload) change,
      // or is this only a change of the URL target entity?
      const dataKey = `${requestContext.entityTypeName}|${requestContext.yacURL}|${numResultsPerPage}|${reloadCount}`;
      const dataChanged = dataKey !== prevDataKeyRef.current;
      prevDataKeyRef.current = dataKey;

      // Only the URL target changed and that entity is already on the current
      // page: just highlight it — no reload, no scroll.
      if (
        !dataChanged &&
        targetEntityName &&
        latestEntriesRef.current.some((e) => e.entityName === targetEntityName)
      ) {
        setScrollTargetName(undefined);
        return;
      }

      setTableHeaderEntries([]);
      setTableEntries([]);
      setTotalNumResults(1);
      setLoading(true);

      const header: string[] = getHeaderEntries(requestContext);
      setTableHeaderEntries(header);

      // Jump to the page containing the targeted entity (from the URL), if any.
      let page = 1;
      if (targetEntityName) {
        const targetPage = await getEntityPage(
          requestContext,
          targetEntityName,
          numResultsPerPage.valueOf(),
          null,
        );
        if (targetPage != null) page = targetPage;
      }
      setCurrPage(page);

      const qRes: QueryResponse = await fetchEntities(
        requestContext,
        numResultsPerPage.valueOf(),
        (page - 1) * numResultsPerPage.valueOf(),
        null,
      );
      // TODO make sure that spamming reload does not cause problem with this.
      // It is likely beneficial to include a cooldown on the reload button.

      if (mounted) {
        setLoading(false);
        setTotalNumResults(qRes.totalNumberOfResults);
        setTableEntries(qRes.partialResults);
        // We (re)loaded and possibly paged: scroll to the target if there is one.
        setScrollTargetName(targetEntityName);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    requestContext.entityTypeName,
    requestContext.yacURL,
    numResultsPerPage,
    reloadCount,
    targetEntityName,
  ]);

  return {
    reloadCount,
    setReloadCount,
    tableEntries,
    setTableEntries,
    tableHeaderEntries,
    setTableHeaderEntries,
    loading,
    setLoading,
    searchTerms,
    setSearchTerms,
    currPage,
    setCurrPage,
    numResultsPerPage,
    setNumResultsPerPage,
    totalNumResults,
    setTotalNumResults,
    scrollTargetName,
  };
}
