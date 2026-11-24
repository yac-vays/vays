import { reportResponse } from '../controller/global/availability';
import { showError } from '../controller/global/notification';
import VAYS_CACHE from '../model/caching';
import { getTokenFromStorage, isStoredTokenExpired } from '../session/login/tokenHandling';
import { canRetryRenewal, renewToken } from '../session/login/tokenRenewal';
import { Nullable } from './types/typeUtils';

/**
 * Creates the header for the authenticated requests.
 *
 * Please note that the URL MUST have the https protocol for the
 * token to be attached.
 * @param url The url for the resource to be accessed.
 * @returns
 */
function getHeaders(url: string): HeadersInit {
  const addHeaders: HeadersInit = new Headers();
  addHeaders.append('Content-Type', 'application/json');
  const token_id = getTokenFromStorage();
  if (token_id) {
    try {
      if (new URL(url).protocol === 'https:') {
        addHeaders.append('Authorization', token_id);
      }
    } catch {
      return new Headers();
    }
  }

  return addHeaders;
}

/**
 * Perform the fetch as given (the headers are sent unchanged).
 * @returns The response, or null if the request could not be sent or answered
 * (an error toast was shown).
 */
async function accessResource(
  url: string,
  method: string,
  headers: HeadersInit,
  requestBody: Nullable<string>,
): Promise<Nullable<Response>> {
  try {
    return await fetch(url, { mode: 'cors', method, headers, body: requestBody ?? undefined });
  } catch {
    showError('Network Error', `Cannot fetch data from backend ${url}.`);
    return null;
  }
}

/**
 * Send a request to a YAC backend, with the user's token attached (never use
 * it for other hosts).
 *
 * With a `cacheContext`, an earlier successful answer for the URL is returned
 * if there is one, and concurrent requests for the URL share one fetch.
 *
 * @returns The response, or null if there is none (an error toast was shown).
 **/
export async function sendRequest(
  url: string,
  method: string = 'GET',
  requestBody: Nullable<string> = null,
  cacheContext: Nullable<string> = null,
): Promise<Response | null> {
  if (getTokenFromStorage() && isStoredTokenExpired()) {
    // Normally renewed in the background before it expires, but timers of
    // background tabs are throttled (or the machine slept): renew now.
    await renewToken();
  }
  if (getTokenFromStorage() && isStoredTokenExpired() && canRetryRenewal()) {
    // The renewal failed for a transient reason (e.g. the OIDC provider is
    // unreachable): the request cannot be sent, but the session is not over.
    showError('Network Error', 'Cannot renew the session at the moment. Please try again.');
    return null;
  }
  if (getTokenFromStorage() && isStoredTokenExpired()) {
    // The stored token is already past its expiry: the backend would answer
    // 401 anyway. Skip the doomed round-trip (a page load fires many requests
    // in parallel — no reason to send them all) and synthesize the 401, so
    // every caller runs its normal auth handling: one friendly re-login
    // toast via handleAuthFailed, not one error per request.
    return new Response(
      JSON.stringify({ title: 'Please sign in again.', message: 'Your session has expired.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (cacheContext) {
    const cacheElt = await VAYS_CACHE.retreive<Response>(cacheContext, url);
    if (cacheElt) {
      return cacheElt.clone();
    } else if (!VAYS_CACHE.preCacheRegister(cacheContext, url)) {
      const resp = await VAYS_CACHE.retreive<Response>(cacheContext, url);
      if (resp) return resp.clone();
      return null;
    }
  }

  const generation = cacheContext ? VAYS_CACHE.generation(cacheContext, url) : 0;
  const headers = getHeaders(url);

  const resp = await accessResource(url, method, headers, requestBody);

  // Invalidated while in flight: a newer fetch owns the entry now.
  const current = cacheContext != null && VAYS_CACHE.generation(cacheContext, url) === generation;
  if (cacheContext && current) {
    VAYS_CACHE.preCacheUnregister(cacheContext, url);
  }
  if (resp == null) return null;

  // Errors are not cached: the next call asks the backend again.
  if (cacheContext && current && resp.ok) {
    VAYS_CACHE.cache(cacheContext, url, resp.clone());
  }

  // Keep the per-backend availability (maintenance / stale data banner) in
  // sync with what the backend just answered. Not awaited: it only needs the
  // status, headers and (for a 503) a clone of the body.
  void reportResponse(url, resp);

  return resp;
}
