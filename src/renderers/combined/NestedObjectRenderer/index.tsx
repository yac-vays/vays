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
import React, { useCallback, useState } from 'react';
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
  // No type checking since the data is only the lenght of the array.
  // But yea, it does give you a heads up if the type is not correct.

  // Index of the item the user just added via the (+) button: that item's
  // accordion mounts expanded (so the new, empty fields are right there to
  // fill in) instead of requiring a manual click to open it.
  const [addedIndex, setAddedIndex] = useState<number | null>(null);

  const addItemCb = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: string, value: any) => {
      return addItem(p, value);
    },
    [addItem],
  );

  // After all hooks: rules of hooks forbid an early return before them.
  if (!visible) return <></>;

  const openDeleteDialog = (p: string, rowIndex: number) => () => {
    showModalMessage(
      translations.deleteDialogTitle ?? 'Delete this item?',
      translations.deleteDialogMessage ?? 'The item is removed from the list.',
      async () => {
        if (!removeItems) return;
        const p2 = p.substring(0, p.lastIndexOf('.'));
        // let idx = parseInt(p.substring(p.lastIndexOf('.') + 1, p.length)) ?? rowIndex;
        removeItems(p2, [rowIndex])();
      },
      async () => {},
      'Delete',
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
          expanded={i === addedIndex}
        />
      );
    });
  return (
    <>
      <FormComponentTitle
        label={label}
        onClick={() => {
          // `data` is the current array length, i.e. the new item's index.
          setAddedIndex(data);
          addItemCb(path, createDefaultValue(schema, rootSchema))();
        }}
        description={description}
        required={required}
        errors={errors}
        hideAddButton={!enabled}
        path={path}
      />
      {toRender}
    </>
  );
};

export default React.memo(
  withJsonFormsArrayLayoutProps(
    withTranslateProps(withArrayTranslationProps(NestedObjectRenderer)),
  ),
  // Compare only the (dispatch-level) props that affect this layout instead of
  // deep-comparing the whole JSON Forms context on every keystroke. Data
  // changes inside rows propagate through the JSON Forms context regardless.
  (prevProps, props) =>
    prevProps.path === props.path &&
    prevProps.enabled === props.enabled &&
    Object.is(prevProps.visible, props.visible) &&
    Object.is(prevProps.schema, props.schema) &&
    Object.is(prevProps.uischema, props.uischema) &&
    Object.is(prevProps.renderers, props.renderers) &&
    Object.is(prevProps.cells, props.cells),
);

export const ArrayLayoutTester: RankedTester = rankWith(24, isObjectArrayWithNesting);
