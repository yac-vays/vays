import { ReactNode } from 'react';
import { ActionsColumnResults } from '../../../controller/local/EntityListController';
import ActionButton from '../Buttons/ActionButton';
import ActionDropdown from '../ActionDropdown/ActionDropdown';
import { RequestContext } from '../../../controller/global/URLValidation';
import { useModalContext } from '../Modal/ModalContext';

interface EntityListRow {
  entryValues: string[];
  requestContext: RequestContext;
}

const EntityListRow = ({ entryValues, requestContext }: EntityListRow) => {
  const tmp = entryValues[entryValues.length - 1] as any;
  const actionPair: ActionsColumnResults = tmp.actionPair;
  const host: string = tmp.host;

  // TODO: Remove
  const { showModal } = useModalContext();
  return (
    <>
      <tr className="border-t border-stroke dark:border-strokedark hover:bg-primary/5" role="row">
        {(function fillRow() {
          let jsx = [];

          for (let i = 0; i < entryValues.length - 1; i++) {
            const entry = entryValues[i];
            jsx.push(
              // TODO: Make this a bit more elegant, avoid such hard coded flags.
              <td
                className="pl-8:first-child border-stroke dark:border-strokedark"
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
            <td
              className="border-stroke dark:border-strokedark"
              style={{ overflowClipMargin: 100 }}
            >
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
                          entityName={host}
                          requestContext={requestContext}
                          alertEnableCallback={(
                            title: string,
                            text: string,
                            confVerb: string,
                            conf: () => void,
                            cancel: () => void,
                          ) => {
                            showModal(title, text, conf, cancel, confVerb);
                            // setTitle(title);
                            // setText(text);
                            // setConfirmVerb(confVerb);

                            // console.log(conf);
                            // setCancelCallback(() => cancel);
                            // setConfirmCallback(() => conf);setShowAlert(true);
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
                  entityName={host}
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
