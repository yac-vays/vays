import EntityListHeaderCell from './EntityListHeaderCell';

const TableHeader = ({
  tableHeaderEntries,
  searchCallback,
}: {
  tableHeaderEntries: string[];
  searchCallback: (index: number) => (newSearchTerm: string | null) => Promise<void>;
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
            // Trailing meta columns are never searchable: always 'Actions', plus
            // 'Logs' when the entity type defines logs (otherwise the column is omitted).
            const numTrailingCols = tableHeaderEntries.includes('Logs') ? 2 : 1;
            // TODO: Searchable should be exited by the controller.
            for (const value of tableHeaderEntries) {
              jsx.push(
                <EntityListHeaderCell
                  key={`${value}-${i}`}
                  searchCallback={searchCallback(i++)}
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
