import { ArrayTranslations } from '@jsonforms/core';
import { useRef } from 'react';
import { showModalMessage } from '../../controller/global/modal';
import { flushPendingDebouncedInputs } from '../../controller/local/EditController/debounceRegistry';

/**
 * Stable React keys for the rows of an array renderer. With the index as key,
 * the state of a row's controls (typed text, open accordion, a just-generated
 * secret) would stay at its position when a row above it is removed.
 *
 * Call `remove(i)` right before removing item `i` from the data.
 */
export function useRowKeys(length: number | undefined): {
  keys: number[];
  remove: (index: number) => void;
} {
  const keys = useRef<number[]>([]);
  const next = useRef(0);

  const count = length || 0;
  while (keys.current.length < count) keys.current.push(next.current++);
  keys.current.length = count;

  return { keys: keys.current, remove: (index) => keys.current.splice(index, 1) };
}

/**
 * {@link useRowKeys} plus the confirm dialog that removes a row of an array
 * renderer.
 */
export function useRemovableRows(
  length: number | undefined,
  path: string,
  removeItems: ((path: string, toDelete: number[]) => () => void) | undefined,
  translations: ArrayTranslations,
): { keys: number[]; openDeleteDialog: (path: string, rowIndex: number) => () => void } {
  const rowKeys = useRowKeys(length);

  const openDeleteDialog = (_p: string, rowIndex: number) => () => {
    showModalMessage(
      translations.deleteDialogTitle ?? 'Delete this item?',
      translations.deleteDialogMessage ?? 'The item is removed from the list.',
      async () => {
        if (!removeItems) return;
        // A pending edit must land before the indices shift.
        flushPendingDebouncedInputs();
        rowKeys.remove(rowIndex);
        removeItems(path, [rowIndex])();
      },
      async () => {},
      'Delete',
    );
  };
  return { keys: rowKeys.keys, openDeleteDialog };
}
