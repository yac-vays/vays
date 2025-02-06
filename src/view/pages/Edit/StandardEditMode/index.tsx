import { JsonFormsCore } from '@jsonforms/core';
import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import _ from 'lodash';
import { memo } from 'react';

import FormsErrorBoundary from './ErrorBoundary';

import { setCurrentContext } from '../../../../controller/local/EditController/ExpertMode/access';
import { updateSchema } from '../../../../controller/local/EditController/StandardMode';
import {
  IsCurrentlyEditingString,
  setFormData,
  setIsCurrentlyEditingString,
} from '../../../../controller/local/EditController/StandardMode/access';
import { showError } from '../../../../controller/local/notification';
import { customRenderers } from '../../../../renderers';
import { RequestEditContext } from '../../../../utils/types/internal/request';
// import { Nullable } from '../../../../utils/typeUtils';
import editingState from '../../../../controller/state/EditCtrlState';
import { isValidDataObject } from '../../../../utils/schema/injectName';
import NoDataIndicator from '../../../components/NoDataIndicator';
import SubLoader from '../../../thirdparty-based-components/SubLoader';
import useInitializeForm from './useInitializeState';

const renderers = [...materialRenderers, ...customRenderers];

interface FormProps {
  requestEditContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (v: boolean) => void;
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
  ({ requestEditContext, setEditErrorMsg, setIsValidating }: FormProps) => {
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
      formContainer,
    } = useInitializeForm(requestEditContext, setEditErrorMsg);

    let isFormProcessing = false;
    const toggleBlurForm = (targetValue: boolean) => {
      isFormProcessing = !isFormProcessing;

      if (targetValue !== isFormProcessing) return;

      formContainer.current?.classList.toggle('opacity-50');
      formContainer.current?.classList.toggle('pointer-events-none');
    };

    const onChangeCallback = async ({ errors, data }: Pick<JsonFormsCore, 'data' | 'errors'>) => {
      setCurrentContext(requestEditContext);
      if (!setupDone || _.isEqual(data, localData)) {
        return;
      }

      if (!IsCurrentlyEditingString()) {
        toggleBlurForm(true);
      }

      console.log(
        'OnChange Handler Start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      );
      setLocalData(data);

      if (!isValidDataObject(data)) {
        if (!IsCurrentlyEditingString()) toggleBlurForm(false);
        showError(
          'Invalid Name',
          'This name is not valid: Characters such as whitespaces and slashes are not allowed.',
        );
        return;
      }

      setIsValidating(true);
      updateSchema(data, requestEditContext, true).then((resp) => {
        if (resp == null) {
          setIsEmpty(true);
        } else {
          setJsonSchema(resp.json_schema);
          setUISchema(resp.ui_schema);
          setEditErrorMsg(resp.detail);
          setLocalData(resp.data);
          setIsEmpty(false);
          setFormData(resp.data, errors);
        }
        setIsValidating(false);
        // if (IsCurrentlyEditingString()) {
        //   //formContainer.current?.classList.toggle("opacity-80");
        // } else {
        // }
        toggleBlurForm(false);
        setIsCurrentlyEditingString(false);

        console.log(
          'OnChange Handler Done >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
        );
      });
    };

    return (
      <>
        <div className="relative w-full h-full">
          <div
            ref={formContainer}
            className="static duration-300"
            style={{ height: window.outerHeight - 380 }}
          >
            {isEmpty ? (
              <div className="w-full h-full items-center align-center">
                <NoDataIndicator />
              </div>
            ) : loading ? (
              <SubLoader action="Loading Schema" />
            ) : (
              <>
                <div className="relative h-full">
                  <FormsErrorBoundary>
                    <JsonForms
                      schema={jsonSchema}
                      uischema={uiSchema}
                      data={localData}
                      renderers={renderers}
                      cells={materialCells}
                      onChange={onChangeCallback}
                      ajv={editingState.ajv}
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
