import { expect, test } from 'vitest';
import { isValidQueryEdit } from '../../src/controller/global/url';

test('only the create route works without an entity name', async () => {
  expect(await isValidQueryEdit('be', 'host', undefined, [], 'read')).toBe(false);
  expect(await isValidQueryEdit('be', 'host', undefined, [], 'edit')).toBe(false);
});
