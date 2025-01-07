import _ from 'lodash';
import React, { useEffect, useState, memo, useRef } from 'react';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';

import { JsonFormsCore } from '@jsonforms/core';

import { customRenderers } from '../../../../renderers';
import { ValidateResponse } from '../../../../model/ValidatorClient';
import { RequestEditContext } from '../../../../controller/global/URLValidation';
import { showError } from '../../../../controller/local/ErrorNotifyController';
import FormsErrorBoundary from './ErrorBoundary';
import { retreiveSchema } from '../../../../controller/local/EditController/shared';
import { updateSchema } from '../../../../controller/local/EditController/StandardMode/StandardEditController';
import {
  IsCurrentlyEditingString,
  setCurrentTab,
  setFormData,
  setIsCurrentlyEditingString,
} from '../../../../controller/local/EditController/StandardMode/StandardState';

import { Nullable } from '../../../../utils/typeUtils';
import { isValidDataObject } from '../../../../schema/injectName';
import editingState from '../../../../controller/state/EditCtrlState';
import SubLoader from '../../../thirdparty-based-components/SubLoader';
import NoDataIndicator from '../../../components/NoDataIndicator';
import { setCurrentContext } from '../../../../controller/local/EditController/ExpertMode/EditorState';

const renderers = [...materialRenderers, ...customRenderers];

interface FormProps {
  requestEditContext: RequestEditContext;
  onYacError: (v: string) => void;
  setValidationStatus: (v: boolean) => void;
}

const Form = memo(
  ({
    requestEditContext,
    onYacError,
    setValidationStatus, // TODO: Clean the code up
  }: FormProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [isEmpty, setIsEmpty] = useState<boolean>(false);
    const [localData, setLocalData] = useState({}); // testdata
    const [jsonSchema, setJsonSchema] = useState({}); // json_schema
    const [uiSchema, setUISchema] = useState({
      type: 'VerticalLayout',
      elements: [],
    }); // ui_schema
    const [isFirst, setIsFirst] = useState<boolean>(true);
    const [setupDone, setSetupDone] = useState<boolean>(false);
    const [hasJustUpdated, setHasJustUpdated] = useState<boolean>(false);
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
        setUISchema(resp.ui_schema as any);
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
        console.log('Early exit for rerendering data.');
        return;
      }

      if (IsCurrentlyEditingString()) {
        //formContainer.current?.classList.toggle("opacity-80");
      } else {
        toggleBlurForm(true);
        //setLoading(true);
      }

      console.log(errors);
      console.log(setupDone);
      console.log(
        'OnChange Handler Start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      );
      console.log('Local Data before: ');
      console.log(localData);
      console.log('New data is:');
      console.log(data);
      setLocalData(data);
      console.log(JSON.stringify(data));
      if (!isValidDataObject(data)) {
        if (!IsCurrentlyEditingString()) toggleBlurForm(false);
        showError(
          'Invalid Name',
          'This name is not valid: Characters such as whitespaces and slashes are not allowed.',
        );
        return;
      }
      console.log('The local data variable data is:');
      console.log(localData);

      setValidationStatus(true);
      updateSchema(data, requestEditContext, true).then((resp) => {
        console.log('Received the newly edited schema from the controller:');
        console.log(resp);
        console.log(JSON.stringify(resp?.data));
        if (resp == null) {
          setIsEmpty(true);
        } else {
          setJsonSchema(resp.json_schema);
          setUISchema(resp.ui_schema as any);
          onYacError(resp.detail);
          setLocalData(resp.data);
          setIsEmpty(false);
          setHasJustUpdated(true);
          setFormData(resp.data, errors);
        }
        setValidationStatus(false);
        // if (IsCurrentlyEditingString()) {
        //   //formContainer.current?.classList.toggle("opacity-80");
        // } else {
        // }
        toggleBlurForm(false);
        setIsCurrentlyEditingString(false);
        console.log('After fetching the schema, the new data received is');
        console.log(data);
        console.log('The local data after finishing the request and updating:');
        console.log(localData);
        console.log('Finished updating the schema.');
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
            className="static duration-300 "
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

export default Form;
