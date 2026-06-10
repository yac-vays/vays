import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { logError } from '../utils/logger';
import { EntityTypeDecl, TYPE_CHECK_ENTITY_TYPE_DECL } from '../utils/types/api';
import { YACBackend } from '../utils/types/config';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { ENTITY_TYPE_CACHE_KEY } from './caching/cachekeys';
import { handleYacResponse } from './utils/handleYacResponse';

/**
 * Checks whether the received object has the right typing. Reduces damage of
 * potential bugs induced by backend or malicious data.
 * @param list
 * @returns
 */
function typeCheckEntityTypeDecl(list: unknown, yacName: string): EntityTypeDecl[] {
  if (typeCheck(`[${TYPE_CHECK_ENTITY_TYPE_DECL}]`, list)) {
    return list as EntityTypeDecl[];
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching type declarations of ${yacName}.`,
  );
  return [];
}

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

  const result = await handleYacResponse(resp, {
    backendTitle: yacBackend.title,
    errorTitle: `Could not fetch Entity Types on ${yacBackend.name}`,
    errorMessage: 'Waking up the admin, please stand by...',
  });

  if (result.kind === 'success') {
    const res = await result.resp.json();
    return typeCheckEntityTypeDecl(res, yacBackend.title);
  } else if (result.kind === 'invalid-request' || result.kind === 'client-error') {
    showError(
      `Error ${result.status}: Can't fetch Entity Types of ${yacBackend.name}`,
      `Server returned: ${JSON.stringify(result.body)}`,
    );
  }

  return [];
}
