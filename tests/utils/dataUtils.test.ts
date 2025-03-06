import { describe, expect, it } from 'vitest';
import { isInjectedNameKey } from '../../src/utils/schema/injectName';

describe('Check injectName', async () => {
  it('Check if injectedName key is not too trivial', async () => {
    const keys = ['schema', '', 'action', 'name', 'entityName', 'entity-name'];
    for (const key of keys) expect(isInjectedNameKey(key)).equals(false);
  });
});
