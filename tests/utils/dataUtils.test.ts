import { describe, expect, it } from 'vitest';
import { isInjectedNameKey } from '../../src/utils/schema/injectName';

// To Test
// import App from "./App";

// Tests
describe('Renders main page correctly', async () => {
  it('Should render the page correctly', async () => {
    const keys = ['schema', '', 'action', 'name', 'entityName', 'entity-name'];
    for (const key of keys) expect(isInjectedNameKey(key)).equals(false);
  });
});
