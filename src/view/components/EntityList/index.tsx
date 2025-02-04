import { RefObject, useEffect, useRef, useState } from 'react';
import './entity-list-styles.css';
import { RequestContext } from '../../../utils/types/internal/request';
import {
  getHeaderEntries,
  fetchEntities,
  reload,
  registerTableScrollContainer,
} from '../../../controller/local/Overview/list';
import { QueryResponse, QueryResult } from '../../../utils/types/internal/entityList';
import SubLoader from '../../thirdparty-based-components/SubLoader';
import NoDataIndicator from '../NoDataIndicator';
import { registerEntityListInvalidationHook } from '../../../model/entityList';
import { EntityListPagination } from './Pagination';
import { invalidateLogCache } from '../../../model/logs';
import TableFrame from './TableFrame';
import TableHeader from './TableHeader';
import TableBody from './TableBody';

interface EntityListProps {
  requestContext: RequestContext;
}

/**
 * The table which is presented in the overview view.
 * TODO: Need to switch to RequestOverviewRequest to allow URL directed rendering.
 *
 * @param requestContext the requestcontext.
 * @returns
 */
const EntityList = ({ requestContext }: EntityListProps) => {
  // Visual State
  const [numColumns, setNumColumns] = useState<number>(0);
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [tableEntries, setTableEntries] = useState<QueryResult[]>([]);
  //const tableEntries = useRef<QueryResult[]>([]);
  const [tableHeaderEntries, setTableHeaderEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerms, setSearchTerms] = useState<(string | null)[]>([]);

  // TODO Make this more performant...
  // Or brdige until this is actually done

  const scrollDivRef = useRef<HTMLDivElement>(null);
  registerTableScrollContainer(scrollDivRef);

  // Query Level information
  const [currPage, setCurrPage] = useState<number>(1);
  const [numResultsPerPage, setNumResultsPerPage] = useState<number>(10);
  const [totalNumResults, setTotalNumResults] = useState<number>(10);

  // Selecor ref
  const selectorRef: RefObject<HTMLSelectElement> = useRef<HTMLSelectElement>(null);

  // const setTableEntries = (l: string[][]) => {
  //   console.log('Resetting the table with entries ' + l.length);
  //   //setTable(l);
  //   tableEntries.current = l;
  // };

  const searchCallback = (index: number) => {
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

      // if (qRes.loadingAlreadyOngoing) {
      //   console.log('Leaving because loading is ongoing ' + requestContext.entityTypeName);
      // } else
      {
        setLoading(false);
        setTotalNumResults(qRes.totalNumberOfResults);
        setTableEntries(qRes.partialResults);
      }
    };
  };

  // Set the header entries and load basic entry.
  useEffect(() => {
    // Race condition prevention.
    // The check is here to avoid multirequest post-context.
    // https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect
    let mounted = true;
    /*
        2 Raceconditions to worry here, multi loading and cross loading
        Good practices here
          https://devtrium.com/posts/async-functions-useeffect#what-if-you-need-to-extract-the-function-outside-useeffect
          https://www.digitalocean.com/community/tutorials/how-to-handle-async-data-loading-lazy-loading-and-code-splitting-with-react

        Note this callback is executed in a closure!
        So do not expect global variables to behave as usual.
      */

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
        setNumColumns(header.length);
        setTableHeaderEntries(header);

        let qRes: QueryResponse = await fetchEntities(
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
          console.log(qRes);
          console.log(requestContext.entityTypeName);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [requestContext.entityTypeName, requestContext.yacURL, numResultsPerPage, reloadCount]);

  const pageSwitch = (targetPageNr: number) => {
    return function () {
      setCurrPage(targetPageNr);
      // Make sure you get the most recent number, hence prefer the value of the reference.
      let numRes: number = numResultsPerPage.valueOf();
      if (selectorRef.current != undefined) {
        numRes = parseInt(selectorRef.current.value);
      }
      // TODO: Reload needs to be updated to allow searching properly.
      reload(
        requestContext,
        {
          setTableHeaderEntries,
          setTableEntries,
          setCurrPage,
          setLoading,
          setNumColumns,
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
          invalidateLogCache(entity.elt[0], requestContext);
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
              className="entity-list w-full table-auto border-collapse  break-words px-4 xl:table-fixed xl:overflow-x-auto overflow-y-block xl:px-8"
              style={{ width: '100%' }}
            >
              <TableHeader
                tableHeaderEntries={tableHeaderEntries}
                searchCallback={searchCallback}
              />
              <TableBody tableEntries={tableEntries} requestContext={requestContext} />
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
                {loading ? <SubLoader action="Loading entries..." /> : <NoDataIndicator />}
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
              className="bg-transparent ml-2 pl-1 rounded border border-grey"
              onChange={(e) => {
                setNumResultsPerPage(parseInt(e.target.value));
              }}
            >
              <option value="5">5</option>
              <option value="10" selected={true}>
                10
              </option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </TableFrame>
    </>
  );
};

export default EntityList;
