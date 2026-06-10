import { JsonFormsCore } from '@jsonforms/core';
import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import _ from 'lodash';
import { memo, useEffect, useState } from 'react';

import FormsErrorBoundary from './ErrorBoundary';

import {
  getEntityYAML,
  setCurrentContext,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { updateSchema } from '../../../../controller/local/EditController/StandardMode';
import {
  IsCurrentlyEditingString,
  setFormData,
  setIsCurrentlyEditingString,
} from '../../../../controller/local/EditController/StandardMode/access';
import { customRenderers } from '../../../../renderers';
import { RequestEditContext } from '../../../../utils/types/internal/request';
// import { Nullable } from '../../../../utils/typeUtils';
import {
  emitValidity,
  getAJV,
  setEditDirty,
  setLocalValidity,
} from '../../../../controller/local/EditController/shared';
import { updateTabsErrorNotification } from '../../../../controller/local/EditController/StandardMode/tabs';
import {
  applyCanonical,
  consumeFormSuppression,
  isStaleValidation,
  nextValidationSeq,
  registerFormWriter,
  setActivePane,
} from '../../../../controller/local/EditController/sync';
import { footerErrorMessage, locateBackendError } from '../../../../utils/schema/locatedErrors';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import NoDataIndicator from '../../../components/NoDataIndicator';
import useInitializeForm from './useInitializeState';

const renderers = [...materialRenderers, ...customRenderers];

interface FormProps {
  requestEditContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (v: boolean) => void;
  /** Reports the initial schema-load state to the frame's unified loader. */
  setLoading: (v: boolean) => void;
}

/**
 * Form component that handles the rendering and management of a JSON form.
 *
 * @param {object} props.requestEditContext - The context for the request edit.
 * @param {function} props.setEditErrorMsg - Callback function to handle errors.
 * @param {function} props.setIsValidating - Function to set the validation status.
 *
 * @returns {JSX.Element} The rendered Form component.
 *
 * @component
 *
 * @remarks
 * The component uses `memo` to optimize rendering performance by memoizing the result.
 */
const StandardEditMode = memo(
  ({ requestEditContext, setEditErrorMsg, setIsValidating, setLoading }: FormProps) => {
    const {
      loading,
      isEmpty,
      setIsEmpty,
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
    } = useInitializeForm(requestEditContext, setEditErrorMsg);

    // Number of in-flight validations that should blur (dim + lock) the form.
    // State-driven (and counted) so the dimming is idempotent and survives
    // re-renders, unlike the former per-render closure flag + classList.toggle.
    const [pendingValidations, setPendingValidations] = useState<number>(0);
    const formBlurred = pendingValidations > 0;

    // Render a (canonical) validation response into the form. Shared between the
    // user's own onChange flow and the cross-pane writer that the YAML editor
    // invokes (via `applyCanonical`) when the user edits YAML instead.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyRespToForm = (resp: ValidateResponse, errors?: any[]) => {
      setJsonSchema(resp.json_schema);
      setUISchema(resp.ui_schema);
      const located = locateBackendError(resp);
      setAdditionalErrors(located.additionalErrors);
      // Always explain a blocked commit in the (tab-independent) footer. Inline
      // control errors only render on the active categorization tab, so a
      // locatable error on another tab — or one that maps to no rendered control
      // (e.g. a `required` object reported at the document root) — would
      // otherwise leave the user with a disabled Commit and no visible reason.
      setEditErrorMsg(footerErrorMessage(resp));
      setLocalData(resp.data);
      setIsEmpty(false);
      setFormData(resp.data, errors);
      updateTabsErrorNotification(
        resp.data,
        resp.json_schema,
        resp.ui_schema,
        located.additionalErrors,
      );
    };

    // Register this form as the "form pane" so YAML edits can be projected back
    // into it. Setters from useState are stable, so a one-time registration is
    // safe.
    useEffect(() => {
      registerFormWriter((resp) => applyRespToForm(resp));
      return () => registerFormWriter(null);
    }, []);

    // Report initial schema-load state to the frame's single loading indicator.
    useEffect(() => {
      setLoading(loading);
    }, [loading, setLoading]);

    const onChangeCallback = async ({ errors, data }: Pick<JsonFormsCore, 'data' | 'errors'>) => {
      setCurrentContext(requestEditContext);
      // Ignore the change event caused by our own programmatic write (YAML ->
      // form projection); otherwise it would re-validate and bounce back — and
      // it must NOT steal "active pane" from the YAML editor the user is in.
      if (consumeFormSuppression()) {
        return;
      }
      if (!setupDone || _.isEqual(data, localData)) {
        return;
      }
      // A genuine user edit in the form: it is now the active pane and the
      // session is dirty (used to warn before navigating away).
      setActivePane('form');
      setEditDirty();

      const didBlur = !IsCurrentlyEditingString();
      if (didBlur) {
        setPendingValidations((c) => c + 1);
      }

      setLocalData(data);

      // Reflect the form's own (JSON Forms) validation immediately for snappy
      // Commit-button feedback; the backend round-trip below confirms it.
      setLocalValidity((errors ?? []).length === 0);
      emitValidity();

      setIsValidating(true);
      const seq = nextValidationSeq();
      // Merge this form change into the YAML the user currently has in the editor
      // (preserving its comments/formatting) rather than regenerating from data.
      updateSchema(data, requestEditContext, true, true, null, getEntityYAML()).then((resp) => {
        if (didBlur) {
          setPendingValidations((c) => Math.max(0, c - 1));
        }
        // A newer edit (in either pane) has since been dispatched; drop this
        // stale response so it cannot clobber the latest state.
        if (isStaleValidation(seq)) {
          setIsValidating(false);
          setIsCurrentlyEditingString(false);
          return;
        }
        if (resp == null) {
          setIsEmpty(true);
        } else {
          applyRespToForm(resp, errors);
          // Project the canonical YAML into the (inactive) YAML pane.
          applyCanonical('form', resp);
        }
        setIsValidating(false);
        setIsCurrentlyEditingString(false);
      });
    };

    return (
      <>
        <div className="relative w-full h-full">
          {/* Fill the (flex-sized) pane and scroll internally, so a tall form
              never grows the page — mirrors the Monaco pane's `h-full`. */}
          <div
            ref={formContainer}
            className={`h-full overflow-y-auto duration-300 ${
              formBlurred ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {isEmpty ? (
              <div className="w-full h-full items-center align-center">
                <NoDataIndicator />
              </div>
            ) : loading ? (
              // The frame shows a single unified loader; render nothing here.
              <></>
            ) : (
              <>
                <div className="relative">
                  <FormsErrorBoundary>
                    <JsonForms
                      schema={jsonSchema}
                      uischema={uiSchema}
                      data={localData}
                      renderers={renderers}
                      cells={materialCells}
                      onChange={onChangeCallback}
                      ajv={getAJV()}
                      additionalErrors={additionalErrors}
                      readonly={requestEditContext.mode === 'read'}
                    />
                  </FormsErrorBoundary>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  },
);

export default StandardEditMode;
