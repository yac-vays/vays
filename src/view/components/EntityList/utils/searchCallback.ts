import { fetchEntities } from '../../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';

export function getSearchCallback(
  hooks: {
    setCurrPage: (v: number) => void;
    setLoading: (v: boolean) => void;
    searchTerms: (string | null)[];
    setSearchTerms: (v: (string | null)[]) => void;
    setTotalNumResults: (v: number) => void;
    setTableEntries: (v: QueryResult[]) => void;
  },
  numResultsPerPage: number,

  requestContext: RequestContext,
): (index: number) => (newSearchTerm: string | null) => Promise<void> {
  const {
    setCurrPage,
    setLoading,
    searchTerms,
    setSearchTerms,
    setTotalNumResults,
    setTableEntries,
  } = hooks;

  return (index: number) => {
    return async (newSearchTerm: string | null) => {
      setCurrPage(1);
      setLoading(true);
      searchTerms[index] = newSearchTerm;

      setSearchTerms(searchTerms);
      const qRes: QueryResponse = await fetchEntities(
        requestContext,
        numResultsPerPage.valueOf(),
        0,
        searchTerms,
      );

      setLoading(false);
      setTotalNumResults(qRes.totalNumberOfResults);
      setTableEntries(qRes.partialResults);
    };
  };
}
