import {
  ArrayLayoutProps,
  ArrayTranslations,
  RankedTester,
  and,
  createDefaultValue,
  isObjectArrayControl,
  isObjectArrayWithNesting,
  isPrimitiveArrayControl,
  not,
  or,
  rankWith,
} from '@jsonforms/core';
import {
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { showModalMessage } from '../../../controller/global/modal';
import { flushPendingDebouncedCommits } from '../../../controller/local/EditController/debounceRegistry';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import { useRowKeys } from '../../utils/useRowKeys';
import Table from './Table';

/**
 *
 * The Array Renderer.
 *
 * @tutorial https://dev.to/edge33/custom-arraylayout-with-react-and-jsonforms-2ch0 Thanks
 * for this brilliant guide which has helped writing this component (particularly on how
 * to communicate with JSON forms at this level. This is not well documented at JSON forms.)
 *
 * @returns {JSX.Element}
 */

export const ArrayControlRenderer = (
  props: ArrayLayoutProps & { translations: ArrayTranslations },
): JSX.Element => {
  const { removeItems, visible, translations } = props;
  const rowKeys = useRowKeys(props.data);

  const openDeleteDialog = (_p: string, rowIndex: number) => () => {
    showModalMessage(
      translations.deleteDialogTitle ?? 'Delete this item?',
      translations.deleteDialogMessage ?? 'The item is removed from the list.',
      async () => {
        if (!removeItems) return;
        // A pending edit must land before the indices shift.
        flushPendingDebouncedCommits();
        rowKeys.remove(rowIndex);
        removeItems(props.path, [rowIndex])();
      },
      async () => {},
      'Delete',
    );
  };
  if (!visible) {
    return <></>;
  }

  return (
    <>
      <div className="mb-2">
        {/* px-1 aligns the title (and its (+) button) with the item boxes,
            which get the same inset from their own controls' p-1 wrappers. */}
        <div className="px-1">
          <FormComponentTitle
            label={props.label}
            onClick={() => {
              props.addItem(props.path, createDefaultValue(props.schema, props.rootSchema))();
            }}
            description={props.description}
            required={props.required}
            errors={props.errors ? [...new Set(props.errors.split('\n'))].join('\n') : ''}
            hideAddButton={!props.enabled}
            path={props.path}
          />
        </div>

        <Table
          {...props}
          rowKeys={rowKeys.keys}
          openDeleteDialog={openDeleteDialog}
          translations={translations}
        />
      </div>
    </>
  );
};

export const ArrayControlTester: RankedTester = rankWith(
  23,
  and(not(isObjectArrayWithNesting), or(isPrimitiveArrayControl, isObjectArrayControl)),
);

export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(ArrayControlRenderer)),
);
