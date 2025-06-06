import { expect, test, vi } from 'vitest';
import { updateYAMLschema } from '../../src/controller/local/EditController/ExpertMode';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';
import {
  VALIDATE_01_ACTIONS,
  VALIDATE_01_NAME,
  VALIDATE_01_NEWYAML,
  VALIDATE_01_OPERATION,
  VALIDATE_01_RESPONSE_VALID,
} from './data';

global.fetch = vi.fn();

/**
 * Note: URL validation (ensuring that the URL has https protocol) happens at the validateConfig
 * stage.
 */
const URL = 'https://yac_no_token.com';

test('tests the validation of the expert mode', async () => {
  //@ts-expect-error The method has been injected above.
  global.fetch.mockResolvedValue(createFetchResponse(VALIDATE_01_RESPONSE_VALID));

  const valResp = await updateYAMLschema(
    VALIDATE_01_NAME,
    VALIDATE_01_NEWYAML,
    getTestEditRequestContext(
      URL,
      'test',
      VALIDATE_01_NAME,
      'testType',
      VALIDATE_01_OPERATION,
      'expert',
    ),
    VALIDATE_01_ACTIONS,
  );

  // expect(fetch).toHaveBeenCalledWith(URL, {
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });

  expect(valResp).toStrictEqual({
    json_schema: VALIDATE_01_RESPONSE_VALID.schemas.json_schema,
    ui_schema: VALIDATE_01_RESPONSE_VALID.schemas.ui_schema,
    data: VALIDATE_01_RESPONSE_VALID.schemas.data,
    valid: VALIDATE_01_RESPONSE_VALID.request.valid && VALIDATE_01_RESPONSE_VALID.schemas.valid,
    detail:
      VALIDATE_01_RESPONSE_VALID.request.message ??
      VALIDATE_01_RESPONSE_VALID.schemas.message ??
      '',
  });
});
