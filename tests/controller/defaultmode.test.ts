import { expect, test, vi } from 'vitest';
import { updateSchema } from '../../src/controller/local/EditController/StandardMode';
import { getSchema } from '../../src/model/validate';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';
import {
  VALIDATE_02_DATA,
  VALIDATE_02_EXPECTED,
  VALIDATE_02_RESPONSE,
  VALIDATE_02_RESPONSE2,
} from './data';

global.fetch = vi.fn();

/**
 * Note: URL validation (ensuring that the URL has https protocol) happens at the validateConfig
 * stage.
 */
const URL = 'https://yac_no_token.com';

test('tests the validation of the standard mode', async () => {
  //@ts-expect-error The method has been injected above.
  global.fetch.mockResolvedValue(createFetchResponse(VALIDATE_02_RESPONSE));
  getSchema(getTestEditRequestContext(URL, 'test', null, 'testType', 'create', 'standard'));
  //@ts-expect-error The method has been injected above.
  global.fetch.mockResolvedValue(createFetchResponse(VALIDATE_02_RESPONSE2));

  const valResp = await updateSchema(
    VALIDATE_02_DATA,
    getTestEditRequestContext(URL, 'test', null, 'testType', 'create', 'standard'),
    true,
    false,
    null,
  );

  expect(valResp).toStrictEqual(VALIDATE_02_EXPECTED);
});
