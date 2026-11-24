/**
 * Caching in sendRequest: only successful answers are cached, and an entry
 * invalidated while its fetch is in flight is not filled by that fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/controller/global/notification', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));
vi.mock('../../src/controller/global/availability', () => ({ reportResponse: vi.fn() }));

const { sendRequest } = await import('../../src/utils/authRequest');
const VAYS_CACHE = (await import('../../src/model/caching')).default;
const { ENTITY_TYPE_CACHE_KEY: CTX } = await import('../../src/model/caching/cachekeys');

let n = 0;
let url: string;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  url = `https://yac.example.com/entity?case=${n++}`;
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('sendRequest cache', () => {
  it('caches a successful answer', async () => {
    fetchMock.mockResolvedValue(new Response('"a"', { status: 200 }));
    await sendRequest(url, 'GET', null, CTX);
    const again = await sendRequest(url, 'GET', null, CTX);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await again?.json()).toBe('a');
  });

  it('does not cache an error answer', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('"ok"', { status: 200 }));
    expect((await sendRequest(url, 'GET', null, CTX))?.status).toBe(503);
    const again = await sendRequest(url, 'GET', null, CTX);
    expect(again?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('drops the answer of a fetch that was invalidated while in flight', async () => {
    let answerOld!: (r: Response) => void;
    let answerNew!: (r: Response) => void;
    fetchMock
      .mockReturnValueOnce(new Promise<Response>((res) => (answerOld = res)))
      .mockReturnValueOnce(new Promise<Response>((res) => (answerNew = res)));

    const older = sendRequest(url, 'GET', null, CTX);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    VAYS_CACHE.invalidate(CTX, url);
    const newer = sendRequest(url, 'GET', null, CTX);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    answerNew(new Response('"new"', { status: 200 }));
    await newer;
    answerOld(new Response('"old"', { status: 200 }));
    await older;

    const cached = await sendRequest(url, 'GET', null, CTX);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await cached?.json()).toBe('new');
  });
});
