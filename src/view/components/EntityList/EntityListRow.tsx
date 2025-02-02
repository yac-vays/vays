import { ReactNode } from 'react';
import { ActionsColumnResults } from '../../../utils/types/internal/actions';
import ActionButton from '../Buttons/ActionButton';
import ActionDropdown from '../ActionDropdown/ActionDropdown';
import { RequestContext } from '../../../utils/types/internal/request';
import { useModalContext } from '../Modal/ModalContext';
import 'react-circular-progressbar/dist/styles.css';
import LogsField from './LogsField';
import { Nullable } from '../../../utils/types/typeUtils';

interface EntityListRow {
  entryValues: string[];
  requestContext: RequestContext;
  link: Nullable<string>;
  actionPair: ActionsColumnResults;
  entityName: string;
}

const EntityListRow = ({
  entryValues,
  requestContext,
  link,
  actionPair,
  entityName,
}: EntityListRow) => {
  const { showModal } = useModalContext();
  return (
    <>
      <tr
        className="border-t border-stroke hover:bg-primary-5"
        role="row"
        title={link ? 'Link to ' + link : undefined}
      >
        {(function fillRow() {
          let jsx = [];

          for (let i = 0; i < entryValues.length - 2; i++) {
            const entry = entryValues[i];
            if (link) {
              jsx.push(
                // TODO: Make this a bit more elegant, avoid such hard coded flags.
                <td
                  className={`pl-8:first-child border-stroke ${i != 0 ? 'opacity-40' : ''}`}
                  style={{ paddingRight: 40 }}
                  role="cell"
                >
                  {entry === '(None)' ? (
                    <>
                      <em className="opacity-50">None</em>
                    </>
                  ) : (
                    entry
                  )}
                  {i == 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-current opacity-40 inline pl-2 cursor-pointer"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                    >
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                    </svg>
                  ) : (
                    <></>
                  )}
                </td>,
              );
              continue;
            }
            jsx.push(
              // TODO: Make this a bit more elegant, avoid such hard coded flags.
              <td
                className="pl-8:first-child border-stroke"
                style={{ paddingRight: 40 }}
                role="cell"
              >
                {entry === '(None)' ? (
                  <>
                    <em className="opacity-50">None</em>
                  </>
                ) : (
                  entry
                )}
              </td>,
            );
          }
          jsx.push(
            <td className="pl-8:first-child border-stroke" style={{ paddingRight: 40 }} role="cell">
              <LogsField requestContext={requestContext} entityName={entityName} />
            </td>,
          );
          jsx.push(
            <td className="border-stroke" style={{ overflowClipMargin: 100 }}>
              {/* overflow:"hidden" */}
              {/* The buttons stacking up version...*/}
              {/* <div className="flex flex-col items-center" style={{width:"100%"}}>
                                <div className="group relative items-center" style={{width:"100%"}}> */}
              {/* Buttons staying together version. */}
              <div className="flex flex-col items-center" style={{}}>
                <div className="items-center flex flex-row">
                  {(function () {
                    let jsx: ReactNode[] = [];
                    let isLeft = true;
                    for (let act of actionPair.favActs) {
                      jsx.push(
                        <ActionButton
                          actArgs={act}
                          isLeft={isLeft}
                          entityName={entityName}
                          requestContext={requestContext}
                          alertEnableCallback={(
                            title: string,
                            text: string,
                            confVerb: string,
                            conf: () => void,
                            cancel: () => void,
                          ) => {
                            showModal(title, text, conf, cancel, confVerb);
                          }}
                        />,
                      );
                      isLeft = false;
                      // TODO: Make right button also rounded and you can push all this logic into
                      // the css logic, using pseudoclasses
                    }
                    return jsx;
                  })()}
                </div>
                <ActionDropdown
                  entityName={entityName}
                  actions={actionPair.dropdownActs}
                  requestContext={requestContext}
                />
              </div>
            </td>,
          );
          return jsx;
        })()}
      </tr>
    </>
  );
};

export default EntityListRow;
