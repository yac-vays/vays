import { RefObject, useEffect, useRef } from 'react';
import { reload } from '../../../controller/local/Overview/list';
import { registerEntityListInvalidationHook } from '../../../model/entityList';
import { invalidateLogCache } from '../../../model/logs';
import iLocalStorage from '../../../session/persistent/LocalStorage';
import { hasLogsDefined } from '../../../utils/logUtils';
import { RequestContext } from '../../../utils/types/internal/request';
import SubLoader from '../../thirdparty/components/SubLoader';
import NoDataIndicator from '../NoDataIndicator';
import TableBody from './Body/TableBody';
import './entity-list-styles.css';
import { EntityListPagination } from './Footer/Pagination';
import TableHeader from './Header/TableHeader';
import TableFrame from './TableFrame';
import { getSearchCallback } from './utils/searchCallback';
import { useInitializeList } from './utils/useInitializeList';

interface EntityListProps {
  requestContext: RequestContext;
  /** Entity to scroll to and highlight (from the URL), if any. */
  highlightEntityName?: string;
}

/**
 * Scrolls the nearest vertically-scrollable ancestor of `el` back to the top.
 * The page content scrolls inside a layout container rather than the window,
 * so we walk up the DOM to find and scroll that container.
 */
function scrollAncestorToTop(el: HTMLElement | null) {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      // Instant (not smooth): a smooth animation would be disrupted by the page
      // content changing height (e.g. the shorter last page), leaving it
      // scrolled down. Jumping immediately is reliable for every page.
      node.scrollTop = 0;
      return;
    }
    node = node.parentElement;
  }
  window.scrollTo({ top: 0 });
}

/**
 * The table which is presented in the overview view.
 *
 * @param requestContext the requestcontext.
 * @returns
 */
const EntityList = ({ requestContext, highlightEntityName }: EntityListProps) => {
  const {
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
  } = useInitializeList(requestContext, highlightEntityName);

  const scrollDivRef = useRef<HTMLDivElement>(null);

  // Selecor ref
  const selectorRef: RefObject<HTMLSelectElement> = useRef<HTMLSelectElement>(null);

  const searchCallback = getSearchCallback(
    {
      setCurrPage,
      setLoading,
      searchTerms,
      setSearchTerms,
      setTotalNumResults,
      setTableEntries,
    },
    numResultsPerPage,
    requestContext,
  );

  const pageSwitch = (targetPageNr: number) => {
    return function () {
      setCurrPage(targetPageNr);
      // Jump to the top of the list (the page scrolls inside a layout container,
      // not the window). Done immediately so the new page renders from the top.
      scrollAncestorToTop(scrollDivRef.current);
      // Make sure you get the most recent number, hence prefer the value of the reference.
      let numRes: number = numResultsPerPage.valueOf();
      if (selectorRef.current != undefined) {
        numRes = parseInt(selectorRef.current.value);
      }
      reload(
        requestContext,
        {
          setTableHeaderEntries,
          setTableEntries,
          setCurrPage,
          setLoading,
        },
        numRes,
        false,
        targetPageNr,
        searchTerms,
      );
    };
  };

  useEffect(() => {
    registerEntityListInvalidationHook(requestContext.yacURL, requestContext.entityTypeName, () => {
      setReloadCount(reloadCount + 1);
      setTimeout(() => {
        for (const entity of tableEntries) {
          invalidateLogCache(entity.elt[0].value, requestContext);
        }
      }, 1000);
    });
  }, [requestContext.yacURL, requestContext.entityTypeName, reloadCount]);

  return (
    <>
      <TableFrame>
        <div
          ref={scrollDivRef}
          style={{ overflowX: 'auto', overscrollBehaviorX: 'none', width: '100%' }}
        >
          <div>
            {/* md:table-fixed                                                                                           xl or xl2?       md:table-fixed md:overflow-auto md:px-8  */}
            <table
              role="table"
              className="entity-list w-full table-auto border-collapse  break-words px-4 xl:overflow-x-auto overflow-y-block xl:px-8"
              style={{ width: '100%' }}
            >
              <TableHeader
                tableHeaderEntries={tableHeaderEntries}
                searchCallback={searchCallback}
                showStatusColumn={hasLogsDefined(requestContext)}
              />
              <TableBody
                tableEntries={tableEntries}
                requestContext={requestContext}
                highlightEntityName={highlightEntityName}
                scrollTargetName={scrollTargetName}
              />
            </table>
          </div>
        </div>
        {/* Loading screen and no data indicator 
                They need to be outside of the table to get the spacing right.*/}
        {tableEntries.length == 0 ? (
          <div className="sm:w-screen md:w-full p-8 pb-12 flex flex-row">
            <div className="group w-full inline-flex flex-col relative" style={{ height: 96 }}>
              <div
                className="group flex flex-col items-center justify-center"
                style={{ alignItems: 'center' }}
              >
                {loading ? (
                  <SubLoader
                    action={
                      requestContext.accessedEntityType?.title
                        ? `Loading ${requestContext.accessedEntityType.title} List...`
                        : 'Loading...'
                    }
                  />
                ) : (
                  <NoDataIndicator />
                )}
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {/* TODO: Find a better fix for the pagination, num entries setter for when you are using phone,
                scrolling is in this case not that pretty. You are using too much space for the pagination probably, too. */}
        <div className="flex justify-between border-t border-stroke px-6 pt-5 overflow-auto">
          <EntityListPagination
            pageSwitch={pageSwitch}
            currPage={currPage}
            totalNumResults={totalNumResults}
            numResultsPerPage={numResultsPerPage}
          />
          <div className="flex items-center font-medium">
            <p className="pl-2 text-plainfont">Show entries</p>
            <select
              ref={selectorRef}
              value={numResultsPerPage}
              className="bg-transparent ml-2 pl-1 rounded border border-grey"
              onChange={(e) => {
                const next = parseInt(e.target.value);
                setNumResultsPerPage(next);
                // Persist so the chosen page size is remembered across sessions.
                iLocalStorage.setNumEntriesPerPage(next);
              }}
            >
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
      </TableFrame>
    </>
  );
};

export default EntityList;
