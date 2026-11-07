import EntityListHeaderCell from './EntityListHeaderCell';

const TableHeader = ({
  tableHeaderEntries,
  searchTerms,
  searchCallback,
  numTrailingCols,
}: {
  tableHeaderEntries: string[];
  searchTerms?: (string | null)[];
  searchCallback: (index: number) => (newSearchTerm: string | null) => Promise<void>;
  /** Number of trailing meta columns: Status, Links, Actions (see numTrailingColumns). */
  numTrailingCols: number;
}) => {
  return (
    <thead id="entity-table-header" className="border-separate px-4">
      <tr role="row">
        {tableHeaderEntries.length == 0 ? (
          <EntityListHeaderCell
            title=""
            searchable={false}
            firstField={true}
            searchCallback={() => {}}
          />
        ) : (
          (function fillHeader() {
            const jsx = [];
            let i = 0;
            const len = tableHeaderEntries.length;
            // Trailing meta columns (Status, Links, Actions) are never searchable.
            // TODO: Searchable should be exited by the controller.
            for (const value of tableHeaderEntries) {
              const colIdx = i++;
              jsx.push(
                <EntityListHeaderCell
                  key={`${value}-${colIdx}`}
                  searchCallback={searchCallback(colIdx)}
                  initialSearchTerm={searchTerms?.[colIdx] ?? ''}
                  title={value}
                  searchable={i <= len - numTrailingCols}
                  firstField={i === 1}
                  shrink={i === len}
                />,
              );
            }
            return jsx;
          })()
        )}
      </tr>
      <tr>
        <td></td>
      </tr>
      <tr className="border-stroke border-b">
        <td></td>
      </tr>
    </thead>
  );
};

export default TableHeader;
