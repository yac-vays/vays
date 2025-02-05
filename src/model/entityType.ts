import { showError } from '../controller/local/notification';
import { handleAuthFailed } from '../session/login/tokenHandling';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { logError } from '../utils/logger';
import { EntityTypeDecl } from '../utils/types/api';
import { YACBackend } from '../utils/types/config';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { ENTITY_TYPE_CACHE_KEY } from './caching/cachekeys';

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
    joinUrl(url, '/entity'),
    'GET',
    null,
    ENTITY_TYPE_CACHE_KEY,
  );

  if (resp == null) {
    return [];
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${yacBackend.title}: ` +
        (ans.title ?? `Could not fetch Entity Types on ${yacBackend.name} (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return [];
  } else if (resp.status == 200) {
    const res = await resp.json();
    return res;
  } else if (hasAuthFailed(resp.status)) {
    // TODO
    handleAuthFailed();
  } else {
    showError(
      `Error ${resp.status}: Can't fetch Entity Types of ${yacBackend.name}`,
      `Server returned: ${JSON.stringify(resp.json())}`,
    );
  }

  return [];
}
