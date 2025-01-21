import { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import './entity-list-styles.css';
import EntityListHeaderCell from './EntityListHeaderCell';
import { RequestContext } from '../../../controller/global/URLValidation';
import EntityListRow from './EntityListRow';
import {
  getHeaderEntries,
  QueryResponse,
  fetchEntities,
  reload,
  registerTableScrollContainer,
  QueryResult,
} from '../../../controller/local/Overview/EntityListController';
import SubLoader from '../../thirdparty-based-components/SubLoader';
import NoDataIndicator from '../NoDataIndicator';
import { registerEntityListInvalidationHook } from '../../../model/EntityListFetcher';
import { EntityListPagination } from './Pagination';
import { invalidateLogCache } from '../../../model/LogsFetcher';

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

  const headerRef = useRef<HTMLTableRowElement>(null);
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

      console.log(requestContext.entityTypeName + ' is done');
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
    // if (!mounted) {
    //   return;
    // }
    /*
        2 Raceconditions to worry here, multi loading and cross loading
        Good practices here
          https://devtrium.com/posts/async-functions-useeffect#what-if-you-need-to-extract-the-function-outside-useeffect
          https://www.digitalocean.com/community/tutorials/how-to-handle-async-data-loading-lazy-loading-and-code-splitting-with-react

        Note this callback is executed in a closure!!!!!!!!!!!!!
        So do not expect global variables to behave as usual.
      */

    (async function () {
      console.log('Initiating the loading.');
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

        //setSearchTerms(Array(header.length).fill(null));
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
      for (const entity of tableEntries) {
        invalidateLogCache(entity.elt[0], requestContext);
      }

      setReloadCount(reloadCount + 1);
    });
  }, [requestContext.yacURL, requestContext.entityTypeName, reloadCount]);

  // const actions: ActionsColumnResults = getActions(requestContext);

  // useEffect(
  //   () => {
  //     console.log("Detected change of num results.");
  //     console.log("Entry gives " + numResultsPerPage);
  //     await (
  //       async function (){
  //         if (requestContext.accessedEntityType?.options == undefined){
  //           setTableHeaderEntries([]);
  //         } else {
  //           const qRes: QueryResponse = await fetchEntities(
  //             requestContext,
  //             numResultsPerPage, null);
  //           setTableEntries(qRes.partialResults);
  //         }
  //       }())
  //     console.log("Exiting num setting");

  //   }, [numResultsPerPage]
  // );

  return (
    <>
      <section className="rounded-sm border border-stroke bg-white shadow-default py-2 dark:border-strokedark dark:bg-boxdark">
        {/* Must do two seperate divs to make sure the border is showing properly when scrolling... */}
        <div
          style={{
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              paddingLeft: 10,
              paddingRight: 10,
            }}
          >
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
                  <thead id="entity-table-header" className="border-separate px-4">
                    <tr
                      ref={headerRef}
                      className="border-t border-stroke dark:border-strokedark"
                      role="row"
                    >
                      {tableHeaderEntries.length == 0 ? (
                        <EntityListHeaderCell
                          title=""
                          searchable={false}
                          firstField={true}
                          searchCallback={(a: string) => {}}
                        />
                      ) : (
                        (function fillHeader() {
                          let jsx = [];
                          let i = 0;
                          const len = tableHeaderEntries.length;
                          // TODO: Searchable should be exited by the controller.
                          for (const value of tableHeaderEntries) {
                            jsx.push(
                              <EntityListHeaderCell
                                searchCallback={searchCallback(i++)}
                                title={value}
                                searchable={i <= len - 2}
                                firstField={i === 1}
                              />,
                            );
                          }
                          return jsx;
                        })()
                      )}
                    </tr>
                    <tr className="border-stroke border-b dark:border-opacity-80">
                      <td></td>
                    </tr>
                    <tr className="border-stroke border-b dark:border-opacity-80">
                      <td></td>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {tableEntries.length == 0 ? (
                      <></>
                    ) : (
                      <>
                        {(function fillTable() {
                          let jsx = [];
                          for (let i = 0; i < tableEntries.length; i++) {
                            jsx.push(
                              <EntityListRow
                                entryValues={tableEntries[i].elt}
                                requestContext={requestContext}
                                link={tableEntries[i].isLink}
                              />,
                            );
                          }
                          return jsx;
                        })()}
                      </>
                    )}
                  </tbody>
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
            <div className="flex justify-between border-t border-stroke px-6 pt-5 dark:border-strokedark overflow-auto">
              <EntityListPagination
                pageSwitch={pageSwitch}
                currPage={currPage}
                totalNumResults={totalNumResults}
                numResultsPerPage={numResultsPerPage}
              />
              <div className="flex items-center font-medium">
                <p className="pl-2 text-black dark:text-white">Show entries</p>
                <select
                  ref={selectorRef}
                  className="bg-transparent pl-2"
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
          </div>
        </div>
        {/* </div>
        </div> */}
      </section>
    </>
  );
};

export default EntityList;
