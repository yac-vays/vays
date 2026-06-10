import { fetchEntities } from '../../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';

/** How long to wait after the last keystroke before actually fetching. */
const SEARCH_DEBOUNCE_MS = 300;

/** Pending debounced fetch (one search runs at a time across all columns). */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Stamp of the latest dispatched search fetch. Responses carrying an older
 * stamp lost the race against a newer search and must not overwrite the newer
 * table content. Mirrors the validationSeq pattern of the edit controller.
 */
let searchSeq = 0;

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
      // keystroke; the sequence stamp drops responses that lost the race.
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const seq = ++searchSeq;
        const qRes: QueryResponse = await fetchEntities(
          requestContext,
          numResultsPerPage.valueOf(),
          0,
          newSearchTerms,
        );
        // A newer search has been dispatched in the meantime — let it win.
        if (seq !== searchSeq) return;

        setLoading(false);
        setTotalNumResults(qRes.totalNumberOfResults);
        setTableEntries(qRes.partialResults);
      }, SEARCH_DEBOUNCE_MS);
    };
  };
}
