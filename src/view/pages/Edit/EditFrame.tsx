import { useState } from 'react';
import { RequestEditContext } from '../../../utils/types/internal/request';
import ExpertMode from './ExpertMode/ExpertMode';
import StandardEditMode from './StandardEditMode';
import { sendFormData } from '../../../controller/local/EditController/StandardMode';
import { sendYAMLData } from '../../../controller/local/EditController/ExpertMode';

/**
 * Component that renders an editing frame with expert or standard mode and feedback.
 *
 * @component
 * @param {RequestEditContext} props.requestEditContext - The context object containing request data
 * @param {boolean} props.isExpertMode - Flag to determine if expert mode is enabled
 *
 * @returns {JSX.Element} A section containing either expert or standard edit mode with error handling and save functionality
 */
const EditFrame = ({
  requestEditContext,
  isExpertMode,
}: {
  requestEditContext: RequestEditContext;
  isExpertMode: boolean;
}): JSX.Element => {
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [yacErrorMsg, setYACErrorMsg] = useState<string>('');
  const [isDisplayingYACError, setIsDisplayingYACError] = useState<boolean>(false);

  const setEditErrorMsg = (msg: string) => {
    if (msg === '') {
      setIsDisplayingYACError(false);
    } else {
      setYACErrorMsg(msg);
      setIsDisplayingYACError(true);
    }
  };
  return (
    <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
      <div
        className="relative px-4 overflow-hidden md:px-8 flex flex-col"
        style={{ minHeight: window.outerHeight - 320 }}
      >
        {/* <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
      <div className="relative px-4 overflow-hidden md:px-8 flex flex-col"></div> */}

        <div className="relative grow flex flex-col">
          {isExpertMode ? (
            <ExpertMode
              requestContext={requestEditContext}
              setEditErrorMsg={setEditErrorMsg}
              setIsValidating={setIsValidating}
            />
          ) : (
            <StandardEditMode
              requestEditContext={requestEditContext}
              setEditErrorMsg={setEditErrorMsg}
              setIsValidating={setIsValidating}
            />
          )}
        </div>

        <div
          className="relative flex group w-full h-full mt-1 border-t"
          style={{ height: 55, borderColor: '#ddddddaa' }}
        >
          <div
            className={`relative flex flex-col grow  mt-4 p-1.5 rounded duration-1000 opacity-0 overflow-x-hidden ${
              isDisplayingYACError && 'opacity-100'
            }`}
            style={{ backgroundColor: 'rgb(200 200 200 / 0.2)' }}
          >
            <span className="text-wrap">Server: "{yacErrorMsg}"</span>
          </div>
          <div
            className=" grid place-items-center align-middle h-full"
            style={{ right: 0, bottom: 0 }}
          >
            <div
              onClick={() => {
                if (requestEditContext.viewMode === 'standard') {
                  if (!isValidating) sendFormData(requestEditContext);
                } else {
                  if (!isValidating) sendYAMLData(requestEditContext);
                }
              }}
              className="cursor-pointer inline-flex items-center justify-center rounded border border-black dark:border-meta-4 py-1.5 px-4 m-4 text-center font-medium text-plainfont hover:bg-opacity-90 hover:bg-primary hover:text-white dark:bg-meta-4 dark:hover:bg-white dark:hover:text-black"
            >
              {isValidating ? (
                <div
                  style={{ borderWidth: 3, right: 10 }}
                  className=" h-4 w-4 animate-spin rounded-full border-2 border-solid border-grey border-t-transparent z-10"
                ></div>
              ) : (
                'Save'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditFrame;
