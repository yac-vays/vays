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
import React, { useCallback } from 'react';
import { showModalMessage } from '../../../controller/global/modal';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import CardRenderer from './CardRenderer';

export const NestedObjectRenderer = ({
  visible,
  enabled,
  //id,
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
  //uischemas,
  required,
  addItem,
  translations,
  removeItems,
}: ArrayLayoutProps & { translations: ArrayTranslations }) => {
  if (!visible) return <></>;

  // No type checking since the data is only the lenght of the array.
  // But yea, it does give you a heads up if the type is not correct.

  const addItemCb = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          enabled={enabled}
        />
      );
    });
  return (
    <>
      <FormComponentTitle
        label={label}
        onClick={() => {
          // createDefaultValue(this.props.schema, this.props.rootSchema)
          addItemCb(path, createDefaultValue(schema, rootSchema))();
        }}
        description={description}
        required={required}
        errors={errors}
        hideAddButton={!enabled}
      />
      {toRender}
    </>
  );
};

export default React.memo(
  withJsonFormsArrayLayoutProps(
    withTranslateProps(withArrayTranslationProps(NestedObjectRenderer)),
  ),
  (prevProps, props) => _.isEqual(prevProps, props),
);

export const ArrayLayoutTester: RankedTester = rankWith(24, isObjectArrayWithNesting);
