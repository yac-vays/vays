import { useState, useRef, useEffect } from 'react';
import { setCurrentTab } from '../../../../controller/local/EditController/StandardMode/access';
import { setCurrentContext } from '../../../../controller/local/EditController/ExpertMode/access';
import { retreiveSchema } from '../../../../controller/local/EditController/shared';
import { showError } from '../../../../controller/local/notification';
import editingState from '../../../../controller/state/EditCtrlState';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';

/**
 * Custom hook to initialize the form state for the edit page.
 *
 * @param {RequestEditContext} requestEditContext - The context for the edit request.
 * @param {(v: string) => void} onYacError - Callback function to handle errors.
 *
 * @returns {object} An object containing the form state and related setters.
 * @returns {boolean} loading - Indicates if the form is (initially) loading.
 * @returns {Function} setLoading - Setter for the loading state.
 * @returns {boolean} isEmpty - Indicates if the form data is empty.
 * @returns {Function} setIsEmpty - Setter for the isEmpty state.
 * @returns {object} localData - The local data for the form.
 * @returns {Function} setLocalData - Setter for the local data.
 * @returns {object} jsonSchema - The JSON schema for the form.
 * @returns {Function} setJsonSchema - Setter for the JSON schema.
 * @returns {ValidateResponse['ui_schema']} uiSchema - The UI schema for the form.
 * @returns {Function} setUISchema - Setter for the UI schema.
 * @returns {boolean} isFirst - Indicates if this is the first render.
 * @returns {Function} setIsFirst - Setter for the isFirst state.
 * @returns {boolean} setupDone - Indicates if the setup is done.
 * @returns {Function} setSetupDone - Setter for the setupDone state.
 * @returns {React.MutableRefObject<HTMLDivElement | null>} formContainer - Ref for the form container element. Needs to be set on the container.
 */
const useInitializeForm = (
  requestEditContext: RequestEditContext,
  onYacError: (v: string) => void,
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [localData, setLocalData] = useState({});
  const [jsonSchema, setJsonSchema] = useState({});
  const [uiSchema, setUISchema] = useState<ValidateResponse['ui_schema']>({
    type: 'VerticalLayout',
    elements: [],
  }); // ui_schema
  const [isFirst, setIsFirst] = useState<boolean>(true);
  const [setupDone, setSetupDone] = useState<boolean>(false);
  const formContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (isFirst) {
      setIsFirst(false);
      return;
    }

    setCurrentTab(0);

    const fetchSchemaUI = async function () {
      setIsEmpty(false);
      setLoading(true);
      setCurrentContext(requestEditContext);
      const resp: Nullable<ValidateResponse> = await retreiveSchema(requestEditContext);
      if (!isMounted) return;

      if (resp == null) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      if (requestEditContext.mode === 'modify') {
        const validate = editingState.ajv.compile(resp.json_schema);
        validate(structuredClone(resp.data));
        if (validate.errors) {
          showError(
            'Migration Warning',
            'There are errors in this file. This may be because ' +
              'you are migrating or your Admin changed the specification. ',
          );
        }
      }
      setSetupDone(true);
      setJsonSchema(resp.json_schema);
      setUISchema(resp.ui_schema);
      setLocalData(resp.data);
      onYacError(resp.detail);

      setLoading(false);
    };
    fetchSchemaUI();

    return () => {
      isMounted = false;
    };
  }, [
    requestEditContext.rc.entityTypeName,
    requestEditContext.rc.yacURL,
    requestEditContext.viewMode,
    requestEditContext.mode,
  ]);

  return {
    loading,
    setLoading,
    isEmpty,
    setIsEmpty,
    localData,
    setLocalData,
    jsonSchema,
    setJsonSchema,
    uiSchema,
    setUISchema,
    isFirst,
    setIsFirst,
    setupDone,
    setSetupDone,
    formContainer,
  };
};

export default useInitializeForm;
