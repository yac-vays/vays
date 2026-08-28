import { useEffect, useRef, useState } from 'react';
import { getActivatedActions } from '../../../../controller/local/EditController/ExpertMode/access';
import {
  beginPaneSession,
  emitValidity,
  getAJV,
  retreiveSchema,
  setLocalValidity,
} from '../../../../controller/local/EditController/shared';
import { revalidateMeta } from '../../../../controller/local/EditController/sync';
import { setCurrentTab } from '../../../../controller/local/EditController/StandardMode/access';
import {
  resetCategoryErrs,
  updateTabsErrorNotification,
} from '../../../../controller/local/EditController/StandardMode/tabs';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { ErrorObject } from 'ajv';
import {
  dropLocallyDuplicatedErrors,
  footerErrorMessage,
  locateBackendError,
} from '../../../../utils/schema/locatedErrors';

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
      // Activate the session for this pane. Exactly the first pane to arrive
      // performs the one-time session resets (status, dirty flag, actions, and
      // seeding the global entity name from the URL context — the Monaco chunk
      // loads lazily, so on a cold load this eager pane must do the seeding or
      // the first validate would send name=null). A late re-activation of the
      // same session is a no-op and preserves what the user already changed.
      beginPaneSession(requestEditContext);
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
      let localErrors: ErrorObject[] = [];
      if (requestEditContext.mode === 'edit') {
        const validate = getAJV().compile(resp.json_schema);
        validate(structuredClone(resp.data));
        localErrors = validate.errors ?? [];
      }
      const migrationError = localErrors.length > 0;

      setSetupDone(true);
      setJsonSchema(resp.json_schema);
      setUISchema(resp.ui_schema);
      setLocalData(resp.data);
      // Show a located schema error on its control — unless the local (AJV)
      // validation already flags the same field, which would render the same
      // problem twice. The offending fields/tabs are highlighted by
      // `updateTabsErrorNotification` + JSON Forms inline.
      const located = locateBackendError(resp);
      const additional = dropLocallyDuplicatedErrors(located.additionalErrors, localErrors);
      setAdditionalErrors(additional);
      if (migrationError) {
        onYacError(
          'There are validation errors — possibly because the specification changed ' +
            '(migration). Please fix the highlighted fields before saving.',
        );
      } else {
        // Footer policy: only errors that cannot be displayed inline in BOTH
        // panes land here (see footerErrorMessage).
        onYacError(footerErrorMessage(resp));
      }
      setLocalValidity(!migrationError);
      emitValidity();
      updateTabsErrorNotification(resp.data, resp.json_schema, resp.ui_schema, additional);

      setLoading(false);

      // Actions toggled in the MetaInfoPanel while the schema was still
      // loading could not re-validate yet (revalidateMeta waits for the
      // canonical seed) — pick them up now so the schema reflects them.
      if (getActivatedActions().length > 0) {
        revalidateMeta(requestEditContext);
      }
    };
    fetchSchemaUI();

    return () => {
      isMounted = false;
    };
  }, [
    requestEditContext.rc.entityTypeName,
    requestEditContext.rc.yacURL,
    requestEditContext.mode,
    // Outside create mode the entity name is part of the editing target: a
    // same-type navigation edit/A -> edit/B (browser back/forward) must reload
    // the form, exactly like the Monaco pane does (see Editor.tsx deps).
    requestEditContext.mode === 'create' ? '' : (requestEditContext.entityName ?? ''),
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
