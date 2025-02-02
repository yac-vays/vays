import { showError } from "../controller/local/ErrorNotifyController";
import { requestFailedNoAuth } from "../session/login/loginProcess";
import { sendRequest, authFailed } from "../utils/AuthedRequest";
import { logError } from "../utils/logger";
import { EntityTypeDecl } from "../utils/types/api";
import { Nullable } from "../utils/types/typeUtils";
import { YACBackend } from '../utils/types/config';


export const ENTITY_TYPE_CACHE_KEY = 'EntityType';
/**
 * @param yacBackend The backend in question.
 * @returns A list of entity types definitions.
 */

export async function getEntityTypes(yacBackend: YACBackend | null): Promise<EntityTypeDecl[]> {
  if (yacBackend == null) return [];
  if (yacBackend.url === undefined) {
    logError(`Backend ${yacBackend.name} URL ${yacBackend.url} was undefined`, 'getEntityTypes');
    return [];
  }

  const url: string = yacBackend.url;

  const resp: Nullable<Response> = await sendRequest(
    url + '/entity',
    'GET',
    null,
    ENTITY_TYPE_CACHE_KEY
  );

  if (resp == null) {
    return [];
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${yacBackend.title}: ` +
      (ans.title ?? `Could not fetch Entity Types on ${yacBackend.name} (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...'
    );
    return [];
  } else if (resp.status == 200) {
    const res = await resp.json();
    return res;
  } else if (authFailed(resp.status)) {
    // TODO
    requestFailedNoAuth();
  } else {
    showError(
      `Error ${resp.status}: Can't fetch Entity Types of ${yacBackend.name}`,
      `Server returned: ${JSON.stringify(resp.json())}`
    );
  }

  return [];
}
