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
import React, { useState } from 'react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import { useRemovableRows } from '../../utils/useRowKeys';
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

  const rows = useRemovableRows(data, path, removeItems, translations);

  // After all hooks: rules of hooks forbid an early return before them.
  if (!visible) return <></>;

  const toRender = Array(data)
    .fill(0)
    .map((_, i) => {
      return (
        <CardRenderer
          key={rows.keys[i]}
          index={i}
          schema={schema}
          uischema={uischema}
          path={composePaths(path, `${i}`)}
          renderers={renderers}
          cells={cells}
          onRemove={rows.openDeleteDialog}
          enabled={enabled}
          expanded={i === addedIndex}
        />
      );
    });
  return (
    <>
      <FormComponentTitle
        label={label}
        onAdd={
          enabled
            ? () => {
                // `data` is the current array length, i.e. the new item's index.
                setAddedIndex(data);
                addItem(path, createDefaultValue(schema, rootSchema))();
              }
            : undefined
        }
        description={description}
        required={required}
        errors={errors}
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
