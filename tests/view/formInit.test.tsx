/**
 * The form pane loads its schema on every mount that carries a real context —
 * including a keyed remount of the edit frame (conflict "Reload", load
 * "Retry"), where the context does not change afterwards.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { getDefaultEditContext } from '../../src/controller/global/url';
import { getTestEditRequestContext } from '../testUtils';

const loadEntitySchema = vi.fn(async () => null);
vi.mock('../../src/controller/local/EditController/load', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadEntitySchema: (...args: unknown[]) => loadEntitySchema(...(args as [])),
}));

import useInitializeForm from '../../src/view/pages/Edit/FormPane/useInitializeForm';

test('placeholder context loads nothing', () => {
  loadEntitySchema.mockClear();
  renderHook(() => useInitializeForm(getDefaultEditContext(), () => {}));
  expect(loadEntitySchema).not.toHaveBeenCalled();
});

test('a mount with the real context loads the schema', async () => {
  loadEntitySchema.mockClear();
  const ctx = getTestEditRequestContext('https://yac.example', 'be', 'web01', 'host', 'edit');
  const { result } = renderHook(() => useInitializeForm(ctx, () => {}));
  await waitFor(() => expect(loadEntitySchema).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.loadFailed).toBe(true));
});
