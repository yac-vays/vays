import {
  ArrayLayoutProps,
  ArrayTranslations,
  composePaths,
  createDefaultValue,
  isObjectArrayWithNesting,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import {
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import _ from 'lodash';
import React from 'react';
import { useCallback } from 'react';
import CardRenderer from './CardRenderer';
import { showModalMessage } from '../../../controller/global/ModalController';
import FormComponentTitle from '../../../view/components/FormComponentTitle';

export const ArrayLayoutRenderer = ({
  visible,
  enabled,
  id,
  description,
  uischema,
  schema,
  label,
  rootSchema,
  renderers,
  cells,
  data,
  path,
  errors,
  uischemas,
  addItem,
  translations,
  removeItems,
}: ArrayLayoutProps & { translations: ArrayTranslations }) => {
  const addItemCb = useCallback(
    (p: string, value: any) => {
      return addItem(p, value);
    },
    [addItem],
  );

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

  const toRender = Array(data)
    .fill(0)
    .map((_, i) => {
      return (
        <CardRenderer
          key={i}
          index={i}
          schema={schema}
          uischema={uischema}
          path={composePaths(path, `${i}`)}
          renderers={renderers}
          cells={cells}
          onRemove={openDeleteDialog}
        />
      );
    });
  return (
    <>
      <FormComponentTitle
        label={label}
        onClick={() => {
          console.log(path);
          // createDefaultValue(this.props.schema, this.props.rootSchema)
          addItemCb(path, createDefaultValue(schema, rootSchema))();
        }}
        description={description}
      />
      {toRender}
    </>
  );
};

export default React.memo(
  withJsonFormsArrayLayoutProps(withTranslateProps(withArrayTranslationProps(ArrayLayoutRenderer))),
  (prevProps, props) => _.isEqual(prevProps, props),
);

export const ArrayLayoutTester: RankedTester = rankWith(24, isObjectArrayWithNesting);
