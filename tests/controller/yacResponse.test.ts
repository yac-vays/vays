import { beforeEach, expect, it, vi } from 'vitest';

const showError = vi.fn();
const showWarning = vi.fn();
vi.mock('../../src/controller/global/notification', () => ({ showError, showWarning }));
vi.mock('../../src/controller/global/url', () => ({ navigateToURL: vi.fn() }));

const { handleYacResponse } = await import('../../src/model/utils/handleYacResponse');

beforeEach(() => {
  showError.mockClear();
  showWarning.mockClear();
});

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

it('shows the YAC-Warning of a successful write as a warning, the write stays a success', async () => {
  const resp = new Response(null, {
    status: 204,
    headers: { 'YAC-Warning': 'Action notify failed' },
  });
  const result = await handleYacResponse(resp, {
    title: 'Backend / Type / entity',
    errorText: 'Delete of entity failed',
    successStatus: 204,
  });
  expect(result.kind).toBe('success');
  expect(showWarning).toHaveBeenCalledWith('Backend / Type / entity', 'Action notify failed');
  expect(showError).not.toHaveBeenCalled();
});
