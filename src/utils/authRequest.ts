import { showError } from '../controller/local/notification';
import VAYS_CACHE from '../model/caching';
import { getTokenFromStorage } from '../session/login/tokenHandling';
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
 * Gateway which takes all the parameters and performs the fetch. Does not modify headers, etc.
 * If you want to add the token to the header, you will need to do that ahead of time.
 *
 * @param url The URL in question.
 * @param method The http method.
 * @param headers The header for the request.
 * @param requestBody The requestbody, as a string. If not available, pass null
 * @param catchAccessError The error handling function.
 * @returns The response.
 */
async function accessResource(
  url: string,
  method: string,
  headers: HeadersInit,
  requestBody: Nullable<string>,
  catchAccessError: (response: Response) => Response,
) {
  if (requestBody != null) {
    return await fetch(url, { mode: 'cors', method, headers, body: requestBody })
      .then((resp) => resp)
      .catch(catchAccessError);
  } else {
    return await fetch(url, { mode: 'cors', method, headers })
      .then((resp) => resp)
      .catch(catchAccessError);
  }
}

/**
 * Request some resource. WILL ATTACH THE TOKEN, so only use for YAC requests.
 * In the future, the token will noo longer be attached explicitly, but stored as secure cookie.
 * If cachecontext is supplied, then the cache will be checked for a previous answer
 * and returned if available. Else, the resource will be fetched and cached.
 * If caching is enabled and some other request for this resource is already
 * ongoing, then this request will be blocked until the other request has succeeded.
 *
 * @param url The full URL to be accessed.
 * @param method The method to use.
 * @param requestBody the body as string
 * @param cacheContext null to not get from cache/save to cache. Else string, being the context.
 * @returns The body. May be an empty object in the event of an error.
 *
 * @note ONLY USE FOR YAC REQUESTS.
 **/
export async function sendRequest(
  url: string,
  method: string = 'GET',
  requestBody: Nullable<string> = null,
  cacheContext: Nullable<string> = null,
): Promise<Response | null> {
  if (cacheContext) {
    const cacheElt = (await VAYS_CACHE.retreive(cacheContext, url)) as Request;
    if (cacheElt) {
      //@ts-expect-error await has no effect on non-promise objects
      return cacheElt.clone();
    } else if (!VAYS_CACHE.preCacheRegister(cacheContext, url)) {
      const resp = (await VAYS_CACHE.retreive(cacheContext, url)) as Response;
      if (resp) return resp.clone();
      return null;
    }
  }

  const headers = getHeaders(url);

  let error: boolean = false;
  const catchAccessError = (response: Response) => {
    if (response.status == undefined)
      showError('Network Error', `Cannot fetch data from backend ${url}.`);
    error = true;
    return response;
  };

  const resp: Response = await accessResource(url, method, headers, requestBody, catchAccessError);

  if (cacheContext) {
    VAYS_CACHE.preCacheUnregister(cacheContext, url);
  }
  if (error || resp.status === undefined) return null;

  if (cacheContext) {
    VAYS_CACHE.cache(cacheContext, url, resp.clone());
  }

  return resp;
}

export function hasAuthFailed(status: number): boolean {
  return status == 401 || status == 403;
}
