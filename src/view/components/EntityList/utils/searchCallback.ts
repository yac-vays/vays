import {
  fetchEntities,
  isStaleListGeneration,
  nextListGeneration,
} from '../../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';

/** How long to wait after the last keystroke before actually fetching. */
const SEARCH_DEBOUNCE_MS = 300;

/** Pending debounced fetch (one search runs at a time across all columns). */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

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
      // Copy before mutating: passing the same array reference to the state
      // setter would make React skip the re-render.
      const newSearchTerms = [...searchTerms];
      newSearchTerms[index] = newSearchTerm;
      setSearchTerms(newSearchTerms);

      // Debounce the fetch so fast typing causes one request, not one per
      // keystroke; the (shared) generation stamp drops responses that lost the
      // race against ANY newer table-content dispatch (search, reload, or the
      // effect loader), not just against a newer search.
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const seq = nextListGeneration();
        const qRes: QueryResponse = await fetchEntities(
          requestContext,
          numResultsPerPage.valueOf(),
          0,
          newSearchTerms,
        );
        // A newer table-content dispatch happened in the meantime — let it win.
        if (isStaleListGeneration(seq)) return;

        setLoading(false);
        setTotalNumResults(qRes.totalNumberOfResults);
        setTableEntries(qRes.partialResults);
      }, SEARCH_DEBOUNCE_MS);
    };
  };
}
