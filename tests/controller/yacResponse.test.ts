import { beforeEach, expect, it, vi } from 'vitest';

const showError = vi.fn();
vi.mock('../../src/controller/global/notification', () => ({ showError }));
vi.mock('../../src/controller/global/url', () => ({ navigateToURL: vi.fn() }));

const { handleYacResponse } = await import('../../src/model/utils/handleYacResponse');

beforeEach(() => showError.mockClear());

it("shows FastAPI's request-validation errors (a list in `detail`) as text", async () => {
  const resp = new Response(
    JSON.stringify({
      detail: [
        { type: 'string_pattern_mismatch', loc: ['body', 'name'], msg: 'String should match' },
        { type: 'missing', loc: ['body', 'copy'], msg: 'Field required' },
      ],
    }),
    { status: 422 },
  );
  const result = await handleYacResponse(resp, {
    title: 'Backend / Type / entity',
    errorText: 'Copy failed',
    genericClientErrors: true,
  });
  expect(result.kind).toBe('invalid-request');
  expect(showError).toHaveBeenCalledWith(
    'Backend / Type / entity',
    'Copy failed (Status 422): body.name: String should match; body.copy: Field required',
  );
});
