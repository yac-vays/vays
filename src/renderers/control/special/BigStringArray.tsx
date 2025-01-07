import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  ArrayTranslations,
  ControlProps,
  RankedTester,
  Resolve,
  and,
  encode,
  isObjectArrayControl,
  isObjectArrayWithNesting,
  isPrimitiveArrayControl,
  isStringControl,
  not,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { isCustomRenderer } from '../../utils/customTesterUtils';
import LargeStringList from '../../../view/thirdparty-based-components/ifc/LargeStringList/LargeStringList';
import ErrorBox from '../../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import FormComponentTitle from '../../../view/components/FormComponentTitle';

export const BigStringArray = (props: ControlProps) => {
  const { visible } = props;

  if (!visible) {
    return null;
  }

  const hasItems = props.data ? props.data.length > 0 : false;
  // TODO: include integer handling.
  return (
    <>
      <div className="pb-4">
        <FormComponentTitle
          hideAddButton
          label={props.label}
          onClick={() => {}}
          description={props.description ?? ''}
        />
        {/* <OverheadLabel
          title={props.label}
          required={props.required || false}
          description={props.description}
        /> */}
        {hasItems ? (
          <p>
            <em className="opacity-60">Click any item to start editing it.</em>
          </p>
        ) : (
          <></>
        )}
        <LargeStringList
          handleChange={props.handleChange}
          path={props.path}
          id={props.id}
          data={props.data}
        />
        <ErrorBox displayError={props.errors} />
      </div>
    </>
  );
};
// isObjectArrayControl, isPrimitiveArrayControl

export const BigStringArrayTester: RankedTester = rankWith(
  23,
  and(
    and(not(isObjectArrayWithNesting), or(isPrimitiveArrayControl)),
    isCustomRenderer('big_string_list'),
  ),
);

export default withJsonFormsControlProps(BigStringArray);
