import { useEffect, useRef, useState } from 'react';
import { setCurrentContext } from '../../../../controller/local/EditController/ExpertMode/access';
import {
  clearYACStatus,
  emitValidity,
  getAJV,
  retreiveSchema,
  setLocalValidity,
} from '../../../../controller/local/EditController/shared';
import { setCurrentTab } from '../../../../controller/local/EditController/StandardMode/access';
import {
  resetCategoryErrs,
  updateTabsErrorNotification,
} from '../../../../controller/local/EditController/StandardMode/tabs';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { ErrorObject } from 'ajv';
import { footerErrorMessage, locateBackendError } from '../../../../utils/schema/locatedErrors';

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
  const [additionalErrors, setAdditionalErrors] = useState<ErrorObject[]>([]);
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
      clearYACStatus();
      resetCategoryErrs();
      // Name + actions are rendered separately in the always-visible
      // MetaInfoPanel, not injected into the form.
      const resp: Nullable<ValidateResponse> = await retreiveSchema(requestEditContext);
      if (!isMounted) return;

      if (resp == null) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      // Detect a "migration" situation: an existing entity whose stored data no
      // longer validates against the current schema (e.g. the spec changed).
      let migrationError = false;
      if (requestEditContext.mode === 'edit') {
        const validate = getAJV().compile(resp.json_schema);
        validate(structuredClone(resp.data));
        migrationError = (validate.errors?.length ?? 0) > 0;
      }

      setSetupDone(true);
      setJsonSchema(resp.json_schema);
      setUISchema(resp.ui_schema);
      setLocalData(resp.data);
      // Show a located schema error on its control; the offending fields/tabs
      // are highlighted by `updateTabsErrorNotification` + JSON Forms inline.
      // The footer status bar (red) carries the explanatory/global message:
      // a migration note when applicable, else the backend detail when it has
      // no in-form location.
      const located = locateBackendError(resp);
      setAdditionalErrors(located.additionalErrors);
      if (migrationError) {
        onYacError(
          'This entity has validation errors — possibly because the specification changed ' +
            '(migration). Please fix the highlighted fields before saving.',
        );
      } else {
        // Always explain a blocked commit in the (tab-independent) footer:
        // inline control errors only render on the active categorization tab, so
        // relying on them leaves the user with no visible reason when the error
        // is on another tab. See the matching comment in StandardEditMode.
        onYacError(footerErrorMessage(resp));
      }
      setLocalValidity(!migrationError);
      emitValidity();
      updateTabsErrorNotification(
        resp.data,
        resp.json_schema,
        resp.ui_schema,
        located.additionalErrors,
      );

      setLoading(false);
    };
    fetchSchemaUI();

    return () => {
      isMounted = false;
    };
  }, [
    requestEditContext.rc.entityTypeName,
    requestEditContext.rc.yacURL,
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
    additionalErrors,
    setAdditionalErrors,
    formContainer,
  };
};

export default useInitializeForm;
