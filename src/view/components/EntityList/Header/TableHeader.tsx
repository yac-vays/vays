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
      <tr className="border-t border-stroke" role="row">
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
      <tr className="border-stroke border-b dark:border-white dark:border-opacity-60">
        <td></td>
      </tr>
      <tr className="border-stroke border-b dark:border-white dark:border-opacity-60">
        <td></td>
      </tr>
    </thead>
  );
};

export default TableHeader;
