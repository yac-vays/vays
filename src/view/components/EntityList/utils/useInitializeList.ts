import { useEffect, useState } from 'react';
import { fetchEntities, getHeaderEntries } from '../../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';

export function useInitializeList(requestContext: RequestContext) {
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [tableEntries, setTableEntries] = useState<QueryResult[]>([]);
  //const tableEntries = useRef<QueryResult[]>([]);
  const [tableHeaderEntries, setTableHeaderEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerms, setSearchTerms] = useState<(string | null)[]>([]);

  // Query Level information
  const [currPage, setCurrPage] = useState<number>(1);
  const [numResultsPerPage, setNumResultsPerPage] = useState<number>(10);
  const [totalNumResults, setTotalNumResults] = useState<number>(10);

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
      } else {
        setTableHeaderEntries([]);
        setTableEntries([]);
        setCurrPage(1);
        setTotalNumResults(1);
        setLoading(true);

        const header: string[] = getHeaderEntries(requestContext);
        setTableHeaderEntries(header);

        const qRes: QueryResponse = await fetchEntities(
          requestContext,
          numResultsPerPage.valueOf(),
          0,
          null,
        );
        // TODO make sure that spamming reload does not cause problem with this.
        // It is likely beneficial to include a cooldown on the reload button.

        if (mounted) {
          setLoading(false);
          setTotalNumResults(qRes.totalNumberOfResults);
          setTableEntries(qRes.partialResults);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [requestContext.entityTypeName, requestContext.yacURL, numResultsPerPage, reloadCount]);

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
  };
}
