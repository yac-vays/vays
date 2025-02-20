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
import FormComponentTitle from '../../../view/components/FormComponentTitle';
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
    return <></>;
  }

  return (
    <>
      <div className="mb-2">
        <FormComponentTitle
          label={props.label}
          onClick={() => {
            props.addItem(props.path, createDefaultValue(props.schema, props.rootSchema))();
          }}
          description={props.description}
          required={props.required}
          errors={props.errors ? [...new Set(props.errors.split('\n'))].join('\n') : ''}
          hideAddButton={!props.enabled}
        />

        <Table {...props} openDeleteDialog={openDeleteDialog} translations={translations} />
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
