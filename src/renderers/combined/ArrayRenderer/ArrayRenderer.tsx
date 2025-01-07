import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  ArrayTranslations,
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
  update,
} from '@jsonforms/core';
import {
  DispatchCell,
  JsonFormsDispatch,
  ResolvedJsonFormsDispatch,
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
// import { MaterialTableControl } from './MaterialTableControl';
// import { DeleteDialog } from '@jsonforms/material-renderers/lib/complex//DeleteDialog';
import { showModalMessage } from '../../../controller/global/ModalController';
import Table from './Table';

export const ArrayControlRenderer = (
  props: ArrayLayoutProps & { translations: ArrayTranslations },
) => {
  const { removeItems, visible, translations } = props;

  const openDeleteDialog = (p: string, rowIndex: number) => () => {
    showModalMessage(
      translations.deleteDialogTitle ?? 'Delete?',
      translations.deleteDialogMessage ?? 'Sure?',
      async () => {
        if (!removeItems) return;
        const p2 = p.substring(0, p.lastIndexOf('.'));
        // let idx = parseInt(p.substring(p.lastIndexOf('.') + 1, p.length)) ?? rowIndex;
        removeItems(p2, [rowIndex])();
      },
      async () => {},
      'Confirm',
    );
  };
  if (!visible) {
    return null;
  }
  // props.addItem = (path: string, value: any): void => {

  // }
  console.log('>>>>>>>>><<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<< aa');
  console.log(props);
  console.log(JSON.stringify(props.data));
  return (
    <>
      {/* <MaterialTableControl
        {...props}
        openDeleteDialog={openDeleteDialog}
        translations={translations}
      /> */}
      <div className="mb-2">
        <Table {...props} openDeleteDialog={openDeleteDialog} translations={translations} />
      </div>
    </>
  );
};
// isObjectArrayControl, isPrimitiveArrayControl

export const ArrayControlTester: RankedTester = rankWith(
  23,
  and(not(isObjectArrayWithNesting), or(isPrimitiveArrayControl, isObjectArrayControl)),
);

export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(ArrayControlRenderer)),
);
