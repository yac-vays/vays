import VAYS_CACHE from '../model/caching';
import { showError } from '../controller/local/ErrorNotifyController';
import { getTokenFromStorage } from '../session/login/loginProcess';
import { Nullable } from './types/typeUtils';

/**
 * Request some resource. WILL ATTACH THE TOKEN, so only use for YAC requests.
 * In the future, the token will noo longer be attached explicitly, but stored as secure cookie.
 * If cachecontext is supplied, then the cache will be checked for a previous answer
 * and returned if available. Else, the resource will be fetched and cached.
 * If caching is enabled and some other request for this resource is already
 * ongoing, then this request will be blocked until the other request has succeeded.
 *
 * @param URL The full URL to be accessed.
 * @param method The method to use.
 * @param requestBody the body as string
 * @param cacheContext null to not get from cache/save to cache.
 * @returns The body. May be an empty object in the event of an error.
 */
export async function sendRequest(
  URL: string,
  method: string = 'GET',
  requestBody: Nullable<string> = null,
  cacheContext: Nullable<string> = null,
): Promise<Response | null> {
  // object | object[] | number
  if (cacheContext) {
    const cacheElt = await VAYS_CACHE.retreive(cacheContext, URL);
    if (cacheElt) {
      return cacheElt.clone();
    } else if (!VAYS_CACHE.preCacheRegister(cacheContext, URL)) {
      const resp = (await VAYS_CACHE.retreive(cacheContext, URL)) as Response;
      if (resp) return resp.clone();
      return null;
    }
  }

  const addHeaders: HeadersInit = new Headers();
  addHeaders.append('Content-Type', 'application/json');
  const token_id = getTokenFromStorage();
  if (token_id) {
    // TODO: Very crude way to make sure the link is sent via https.
    // TODO: MUST MOVE THIS WHOLE THING TO COOKIES.
    if (URL.startsWith('https://')) {
      addHeaders.append('Authorization', token_id);
    }
  }
  // } else {
  //   addHeaders.append('Authorization', getTokenFromStorage() ?? 'None'); //`Bearer ${token}`);
  // }

  let error: boolean = false;
  const resultCallback = (response: Response) => {
    if (response.status == undefined)
      showError('Network Error', `Cannot fetch data from backend ${URL}.`);
    error = true;
    return response;
  };

  let resp: Response;
  if (requestBody != null) {
    resp = await fetch(URL, {
      mode: 'cors',
      method: method,
      headers: addHeaders,
      body: requestBody,
      // credentials: 'include', // TODO: Currently does not work because YAC Allow Origin setting
    })
      // .then((r) => {
      //   if (r.status >= 500) {
      //     console.error('Cannnt');
      //     console.error(r);
      //   }
      //   return r;
      // })
      .then((resp) => resp)
      .catch(resultCallback);
  } else {
    resp = await fetch(URL, {
      mode: 'cors',
      method: method,
      headers: addHeaders,
      // credentials: 'include', // TODO: Currently does not work because YAC Allow Origin setting
    })
      // .then((r) => {
      //   if (r.status >= 500) {
      //     console.error('Cannnt');
      //     console.error(r);
      //   }
      //   return r;
      // });
      .then((resp) => resp)
      .catch(resultCallback);
  }

  if (cacheContext) {
    VAYS_CACHE.preCacheUnregister(cacheContext, URL);
  }
  if (error || resp.status === undefined) return null;

  if (cacheContext) {
    VAYS_CACHE.cache(cacheContext, URL, resp.clone());
  }

  return resp;
}

export function authFailed(status: number): boolean {
  return status == 401 || status == 403;
}
