import { useEffect, useRef, useState } from 'react';
import { getActivatedActions } from '../../../../controller/local/EditController/editState';
import { getValidationAJV } from '../../../../controller/local/EditController/editState';
import { loadEntitySchema } from '../../../../controller/local/EditController/load';
import {
  beginPaneSession,
  emitValidity,
  setLocalValidity,
} from '../../../../controller/local/EditController/status';
import { revalidateMeta } from '../../../../controller/local/EditController/sync';
import { setCurrentTab } from '../../../../controller/local/EditController/formPane/access';
import {
  resetCategoryErrs,
  updateTabsErrorNotification,
} from '../../../../controller/local/EditController/formPane/tabs';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { ErrorObject } from 'ajv';
import { getAllErrors } from '../../../../utils/schema/dataUtils';
import {
  dropLocallyDuplicatedErrors,
  footerErrorMessage,
  locateBackendError,
} from '../../../../utils/schema/locatedErrors';

/**
 * Loads the entity's schema and data for the form pane and holds the form's
 * state. `loadFailed` is set when the load returned nothing; `setupDone` once
 * the first load has been rendered (form edits before that are ignored).
 *
 * @param onYacError Receives the footer message of the load.
 */
const useInitializeForm = (
  requestEditContext: RequestEditContext,
  onYacError: (v: string) => void,
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [localData, setLocalData] = useState({});
  const [jsonSchema, setJsonSchema] = useState({});
  const [uiSchema, setUISchema] = useState<ValidateResponse['ui_schema']>({
    type: 'VerticalLayout',
    elements: [],
  }); // ui_schema
  const [setupDone, setSetupDone] = useState<boolean>(false);
  const [additionalErrors, setAdditionalErrors] = useState<ErrorObject[]>([]);
  const formContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The placeholder context of the first render: nothing to load yet.
    if (requestEditContext.rc.yacURL == null) return;
    let isMounted = true;

    setCurrentTab(0);

    const fetchSchemaUI = async function () {
      setLoadFailed(false);
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
      const resp: Nullable<ValidateResponse> = await loadEntitySchema(requestEditContext);
      if (!isMounted) return;

      if (resp == null) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      // Detect a "migration" situation: an existing entity whose stored data no
      // longer validates against the current schema (e.g. the spec changed).
      let localErrors: ErrorObject[] = [];
      if (requestEditContext.mode === 'edit') {
        // null: a schema Ajv cannot compile, already reported by the load.
        localErrors = getAllErrors(resp.data, resp.json_schema, getValidationAJV()) ?? [];
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
            '(migration). Please fix the highlighted fields before committing.',
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
    loadFailed,
    setLoadFailed,
    localData,
    setLocalData,
    jsonSchema,
    setJsonSchema,
    uiSchema,
    setUISchema,
    setupDone,
    additionalErrors,
    setAdditionalErrors,
    formContainer,
  };
};

export default useInitializeForm;
