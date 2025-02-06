import { QueryResult } from '../../../../utils/types/internal/entityList';
import { RequestContext } from '../../../../utils/types/internal/request';
import EntityListRow from './EntityListRow';

const TableBody = ({
  tableEntries,
  requestContext,
}: {
  tableEntries: QueryResult[];
  requestContext: RequestContext;
}) => {
  return (
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
                  entityName={tableEntries[i].entityName}
                  entryValues={tableEntries[i].elt}
                  requestContext={requestContext}
                  link={tableEntries[i].isLink}
                  actionPair={tableEntries[i].actionPair}
                />,
              );
            }
            return jsx;
          })()}
        </>
      )}
    </tbody>
  );
};

export default TableBody;
