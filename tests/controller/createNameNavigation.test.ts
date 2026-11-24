/**
 * While creating, the URL follows the typed name: encoded (a name is one path
 * segment) and without a history entry per keystroke.
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { registerNavigationHook } from '../../src/controller/global/url';
import { editViewNavigateToNewName } from '../../src/controller/global/url';
import { getTestEditRequestContext } from '../testUtils';

const nav = vi.fn();

beforeEach(() => {
  nav.mockClear();
  registerNavigationHook(nav);
  window.history.replaceState(null, '', '/be/host/create/');
});

test('encodes the name and replaces the history entry', () => {
  const ctx = getTestEditRequestContext('https://x', 'be', null, 'host', 'create');
  editViewNavigateToNewName('a/b?c#d', ctx);
  expect(nav).toHaveBeenCalledWith('/be/host/create/a%2Fb%3Fc%23d', { replace: true });
  editViewNavigateToNewName(null, ctx);
  expect(nav).toHaveBeenLastCalledWith('/be/host/create/', { replace: true });
});

test('does nothing in edit mode or after leaving the create view', () => {
  editViewNavigateToNewName('x', getTestEditRequestContext('https://x', 'be', 'a', 'host', 'edit'));
  window.history.replaceState(null, '', '/be/host');
  editViewNavigateToNewName(
    'x',
    getTestEditRequestContext('https://x', 'be', null, 'host', 'create'),
  );
  expect(nav).not.toHaveBeenCalled();
});
