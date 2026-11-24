import { afterEach, expect, it } from 'vitest';
import iLocalStorage from '../../src/session/persistent/LocalStorage';

afterEach(() => localStorage.clear());

it('treats values that are not JSON as absent', () => {
  localStorage.setItem('isLoggedIn', 'yes');
  localStorage.setItem('token', 'Bearer raw');
  localStorage.setItem('numEntriesPerPage', '{');
  expect(iLocalStorage.isLoggedIn()).toBeUndefined();
  expect(iLocalStorage.getToken()).toBeUndefined();
  expect(iLocalStorage.getNumEntriesPerPage()).toBe(10);
});
