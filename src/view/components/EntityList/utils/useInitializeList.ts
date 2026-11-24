import { useEffect, useRef, useState } from 'react';
import { showInfo } from '../../../../controller/global/notification';
import { buildCreateURL, navigateToURL } from '../../../../controller/global/url';
import {
  hasActiveFilters,
  loadSearchTerms,
  saveSearchTerms,
  SearchTerms,
} from '../../../../controller/local/Overview/filters';
import {
  fetchEntities,
  getEntityPage,
  getHeaderEntries,
  isStaleListGeneration,
  nextListGeneration,
} from '../../../../controller/local/Overview/list';
import { probeEntity } from '../../../../model/entityData';
import iLocalStorage from '../../../../session/persistent/LocalStorage';
import { QueryResponse, QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';
import { entityToastTitle } from '../../../../utils/toastUtils';

export function useInitializeList(requestContext: RequestContext, targetEntityName?: string) {
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [tableEntries, setTableEntries] = useState<QueryResult[]>([]);
  //const tableEntries = useRef<QueryResult[]>([]);
  const [tableHeaderEntries, setTableHeaderEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // The column filters, restored from the tab's session (see filters.ts).
  const [searchTerms, setSearchTerms] = useState<SearchTerms>(() =>
    loadSearchTerms(requestContext),
  );
  // The entity to scroll to. Only set when we actually (re)load/page to it, so
  // that simply highlighting an already-visible entity does not scroll.
  const [scrollTargetName, setScrollTargetName] = useState<string | undefined>(undefined);

  // Query Level information
  const [currPage, setCurrPage] = useState<number>(1);
  const [numResultsPerPage, setNumResultsPerPage] = useState<number>(
    iLocalStorage.getNumEntriesPerPage(),
  );
  const [totalNumResults, setTotalNumResults] = useState<number>(10);

  // Always-current view of the entries / data identity, read inside the effect
  // without making them dependencies (which would cause unwanted reloads).
  const latestEntriesRef = useRef<QueryResult[]>(tableEntries);
  latestEntriesRef.current = tableEntries;
  // Current search filter, read inside the (re)load effect without being one of
  // its dependencies — otherwise every keystroke would trigger a full reload
  // (the search box drives filtering itself, see getSearchCallback). This lets a
  // manual "Refresh table" re-apply the active filter instead of dropping it.
  const latestSearchTermsRef = useRef<(string | null)[]>(searchTerms);
  latestSearchTermsRef.current = searchTerms;
  const latestPageRef = useRef<number>(currPage);
  latestPageRef.current = currPage;
  const prevDataKeyRef = useRef<string>('');
  const prevListKeyRef = useRef<string>('');
  const prevTargetRef = useRef<string | undefined>(undefined);
  // The list (backend + type) whose stored filters are loaded. The type
  // declaration (its columns) may only arrive after mounting.
  const listIdentity = `${requestContext.yacURL}|${requestContext.entityTypeName}`;
  const filtersLoadedForRef = useRef<string | null>(
    requestContext.accessedEntityType?.options != undefined ? listIdentity : null,
  );

  /** Replace the filters (state, the effect's view of them and the session). */
  const applySearchTerms = (terms: SearchTerms) => {
    latestSearchTermsRef.current = terms;
    setSearchTerms(terms);
    saveSearchTerms(requestContext, terms);
  };

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

      if (filtersLoadedForRef.current !== listIdentity) {
        filtersLoadedForRef.current = listIdentity;
        const stored = loadSearchTerms(requestContext);
        latestSearchTermsRef.current = stored;
        setSearchTerms(stored);
      }

      // Did the underlying data (type/backend/page size/explicit reload) change,
      // or is this only a change of the URL target entity?
      const dataKey = `${requestContext.entityTypeName}|${requestContext.yacURL}|${numResultsPerPage}|${reloadCount}`;
      const dataChanged = dataKey !== prevDataKeyRef.current;
      prevDataKeyRef.current = dataKey;
      // Did the user navigate to a (new) target entity, as opposed to a reload
      // of the list while the same entity stays pinned in the URL?
      const targetChanged = targetEntityName !== prevTargetRef.current;
      prevTargetRef.current = targetEntityName;
      // A reload of the same list (refresh, after a delete, ...) stays on the
      // page the user is on instead of returning to the first or target page.
      const listKey = `${requestContext.entityTypeName}|${requestContext.yacURL}|${numResultsPerPage}`;
      const keepPage = listKey === prevListKeyRef.current && !targetChanged;
      prevListKeyRef.current = listKey;

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

      // Shared table-content generation (with reload + search): this run's
      // writes below are dropped if any of the three paths dispatched again
      // in the meantime — the `mounted` flag alone only covers unmounts, not
      // a newer same-mount dispatch from another path.
      const gen = nextListGeneration();

      const header: string[] = getHeaderEntries(requestContext);
      setTableHeaderEntries(header);

      /**
       * The targeted entity is not in the list. Ask YAC whether it exists:
       * only if it doesn't (404) the user is forwarded to the create form,
       * prefilled with the requested name. Otherwise the list is shown — the
       * user may not see the entity (403, toast shown) or the check failed
       * (toast shown).
       */
      const handleMissingTarget = async (): Promise<'done' | 'stay'> => {
        if (!targetEntityName) return 'stay';
        const existence = await probeEntity(targetEntityName, requestContext);
        // 'done': superseded by a newer load, or navigated to the create form.
        if (!mounted || isStaleListGeneration(gen)) return 'done';
        if (
          existence === 'missing' &&
          requestContext.backendObject &&
          requestContext.entityTypeName
        ) {
          navigateToURL(
            buildCreateURL(
              requestContext.backendObject,
              requestContext.entityTypeName,
              targetEntityName,
            ),
          );
          return 'done';
        }
        return 'stay';
      };

      // Jump to the page containing the targeted entity (from the URL), if any.
      let page = keepPage ? latestPageRef.current : 1;
      if (targetEntityName && !keepPage) {
        const targetPage = await getEntityPage(
          requestContext,
          targetEntityName,
          numResultsPerPage.valueOf(),
          latestSearchTermsRef.current,
        );
        if (!mounted || isStaleListGeneration(gen)) return;
        if (targetPage != null) {
          page = targetPage;
        } else if (targetChanged && hasActiveFilters(latestSearchTermsRef.current)) {
          // The targeted entity is hidden by the column filters (e.g. a link
          // to it was opened while the list is filtered): when it is in the
          // unfiltered list, drop the filters to show it — with a way back.
          const unfilteredPage = await getEntityPage(
            requestContext,
            targetEntityName,
            numResultsPerPage.valueOf(),
            null,
          );
          if (!mounted || isStaleListGeneration(gen)) return;
          if (unfilteredPage != null) {
            const previousTerms = latestSearchTermsRef.current;
            applySearchTerms([]);
            page = unfilteredPage;
            showInfo(
              entityToastTitle(requestContext, targetEntityName),
              'The column filters were removed to show it.',
              {
                label: 'Restore filters',
                onClick: () => {
                  applySearchTerms(previousTerms);
                  setReloadCount((c) => c + 1);
                },
              },
            );
          } else if ((await handleMissingTarget()) === 'done') {
            // Not in the unfiltered list either: missing (create form) or not
            // visible to the user — then the filtered list stays.
            return;
          }
        } else if (targetChanged) {
          if ((await handleMissingTarget()) === 'done') return;
        }
      }
      // Guarded like the final writes: a superseded run must not move the
      // page indicator for a table it no longer describes.
      setCurrPage(page);

      const fetchPage = () =>
        fetchEntities(
          requestContext,
          numResultsPerPage.valueOf(),
          (page - 1) * numResultsPerPage.valueOf(),
          latestSearchTermsRef.current,
        );
      let qRes: QueryResponse = await fetchPage();
      if (keepPage && page > 1 && qRes.partialResults.length === 0) {
        // The kept page no longer exists (fewer entries now): show the last one.
        if (!mounted || isStaleListGeneration(gen)) return;
        page = Math.max(1, Math.ceil(qRes.totalNumberOfResults / numResultsPerPage.valueOf()));
        setCurrPage(page);
        qRes = await fetchPage();
      }

      if (mounted && !isStaleListGeneration(gen)) {
        setLoading(false);
        setTotalNumResults(qRes.totalNumberOfResults);
        setTableEntries(qRes.partialResults);
        // We navigated to the target and possibly paged: scroll to it.
        setScrollTargetName(keepPage ? undefined : targetEntityName);
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
