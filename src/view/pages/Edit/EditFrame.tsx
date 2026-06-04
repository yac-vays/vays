import { useEffect, useState } from 'react';
import { sendYAMLData } from '../../../controller/local/EditController/ExpertMode';
import {
  isFormValid,
  setUsagesListener,
  setValidityListener,
} from '../../../controller/local/EditController/shared';
import { sendFormData } from '../../../controller/local/EditController/StandardMode';
import { LimitUsage } from '../../../utils/types/api';
import { RequestEditContext } from '../../../utils/types/internal/request';
import ExpertMode from './ExpertMode/ExpertMode';
import StandardEditMode from './StandardEditMode';
import UsageIndicator from './UsageIndicator';

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
  const [isReadOnly, setIsReadOnly] = useState<boolean>(requestEditContext.mode === 'read');
  const [usages, setUsages] = useState<LimitUsage[]>([]);
  const [isValid, setIsValid] = useState<boolean>(isFormValid());

  // Both edit modes funnel validation results through the controller's
  // `setYACStatus`, which notifies these listeners with the latest limit usages
  // and overall validity (used to enable/disable the Save button).
  useEffect(() => {
    setUsagesListener(setUsages);
    setValidityListener(setIsValid);
    return () => {
      setUsagesListener(null);
      setValidityListener(null);
    };
  }, []);

  const saveDisabled = isValidating || !isValid;

  const setEditErrorMsg = (msg: string) => {
    if (msg === '') {
      setIsDisplayingYACError(false);
    } else {
      setYACErrorMsg(msg);
      setIsDisplayingYACError(true);
    }
  };
  useEffect(() => {
    setIsReadOnly(requestEditContext.mode === 'read');
  }, [requestEditContext.mode]);
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
            className={`relative flex flex-col grow  mt-4 p-1.5 rounded duration-1000 opacity-0 overflow-x-hidden border-l-4 ${
              isDisplayingYACError && 'opacity-100'
            }`}
            style={{
              backgroundColor: 'rgb(211 47 47 / 0.08)',
              borderColor: '#d32f2f',
            }}
          >
            <span className={`text-wrap text-[#d32f2f] ${isReadOnly ? 'opacity-0' : ''}`}>
              {yacErrorMsg}
            </span>
          </div>
          {isReadOnly ? (
            <></>
          ) : (
            <div className="flex items-center px-2">
              <UsageIndicator usages={usages} />
            </div>
          )}
          {isReadOnly ? (
            <></>
          ) : (
            <div
              className=" grid place-items-center align-middle h-full"
              style={{ right: 0, bottom: 0 }}
            >
              <div
                title={
                  !isValid && !isValidating
                    ? 'Resolve the highlighted errors before saving.'
                    : undefined
                }
                onClick={() => {
                  if (saveDisabled) return;
                  if (requestEditContext.viewMode === 'standard') {
                    sendFormData(requestEditContext);
                  } else {
                    sendYAMLData(requestEditContext);
                  }
                }}
                className={`inline-flex items-center justify-center rounded border py-1.5 px-4 m-4 text-center font-medium ${
                  saveDisabled
                    ? 'cursor-not-allowed border-stroke text-reducedfont opacity-50'
                    : 'cursor-pointer border-black dark:border-meta-4 text-plainfont hover:bg-opacity-90 hover:bg-primary hover:text-white dark:bg-meta-4 dark:hover:bg-white dark:hover:text-black'
                }`}
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
          )}
        </div>
      </div>
    </section>
  );
};

export default EditFrame;
