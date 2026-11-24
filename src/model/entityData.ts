import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle } from '../utils/toastUtils';
import { EntityData, TYPE_CHECK_ENTITY_DATA } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { entityPath, joinUrl } from '../utils/urlUtils';
import { handleYacResponse, YacErrorBody, yacErrorDetail } from './utils/handleYacResponse';

type EntityResponse =
  | { kind: 'ok'; resp: Response }
  /** HTTP 404 (no toast unless `toastGone`). */
  | { kind: 'gone' }
  /** HTTP 403 (a toast has been shown). */
  | { kind: 'hidden' }
  /** Any other failure (a toast or the availability banner has been shown). */
  | { kind: 'error' };

/** GET an entity, with the error handling shared by all readers. */
async function requestEntity(
  entityName: string,
  requestContext: RequestContext,
  { toastGone = false, forbiddenDetail }: { toastGone?: boolean; forbiddenDetail?: string } = {},
): Promise<EntityResponse> {
  const url = requestContext.yacURL;
  if (url == null) return { kind: 'error' };

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, entityPath(requestContext.entityTypeName, entityName)),
    'GET',
  );
  const title = entityToastTitle(requestContext, entityName);
  const errorText = `Read of ${entityName} failed`;
  const result = await handleYacResponse(resp, {
    title,
    errorText,
    errorMessage: 'Please contact the admin to resolve this issue.',
    ...(forbiddenDetail
      ? {
          errorDetail: (status: number, body: YacErrorBody) =>
            status === 403
              ? forbiddenDetail
              : yacErrorDetail(
                  errorText,
                  status,
                  body,
                  'Please contact the admin to resolve this issue.',
                ),
        }
      : {}),
  });

  if (result.kind === 'success') return { kind: 'ok', resp: result.resp };
  if (result.kind === 'forbidden') return { kind: 'hidden' };
  const gone = result.kind === 'client-error' && result.status === 404;
  if (gone && !toastGone) return { kind: 'gone' };
  if (result.kind === 'network-error') {
    showError(title, `${errorText}: the backend could not be reached.`);
  } else if (result.kind === 'client-error' || result.kind === 'invalid-request') {
    showError(title, yacErrorDetail(errorText, result.status, result.body, 'Please try again.'));
  }
  return gone ? { kind: 'gone' } : { kind: 'error' };
}

/** The stored entity, or null if it cannot be read (a toast has been shown). */
export async function getEntityData(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityData | null> {
  const res = await requestEntity(entityName, requestContext, { toastGone: true });
  return res.kind === 'ok' ? typeCheckEntityData(await res.resp.json(), entityName) : null;
}

export type StoredEntityResult =
  | { kind: 'found'; entity: EntityData }
  /** HTTP 404: the entity no longer exists (no toast shown). */
  | { kind: 'gone' }
  /** Any other failure (a toast has been shown). */
  | { kind: 'error' };

/**
 * Fetch the stored version of an entity for the edit-conflict flow. Unlike
 * {@link getEntityData}, a 404 is an expected outcome here (the other party
 * may have deleted the entity) and is reported as `gone` instead of a toast.
 */
export async function getStoredEntity(
  entityName: string,
  requestContext: RequestContext,
): Promise<StoredEntityResult> {
  const res = await requestEntity(entityName, requestContext);
  if (res.kind === 'gone') return res;
  if (res.kind !== 'ok') return { kind: 'error' };
  const entity = typeCheckEntityData(await res.resp.json(), entityName);
  return entity == null ? { kind: 'error' } : { kind: 'found', entity };
}

export type EntityExistence =
  /** HTTP 200: the entity exists and the user may see it. */
  | 'exists'
  /** HTTP 404: the entity does not exist. */
  | 'missing'
  /**
   * HTTP 403: either the entity exists but the user may not see it, or it does
   * not exist and the user's `see` permission depends on the entity data (YAC
   * evaluates the roles on empty data then). A toast has been shown.
   */
  | 'hidden'
  /** Any other failure (a toast or the availability banner has been shown). */
  | 'error';

/**
 * Ask YAC whether an entity exists, without the read-failure toast of
 * {@link getEntityData} for the expected 404.
 */
export async function probeEntity(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityExistence> {
  const res = await requestEntity(entityName, requestContext, {
    forbiddenDetail: 'It does not exist or you lack the permission to see it.',
  });
  if (res.kind === 'ok') return 'exists';
  return res.kind === 'gone' ? 'missing' : res.kind;
}

function typeCheckEntityData(ed: unknown, entityName: string): Nullable<EntityData> {
  if (typeCheck(TYPE_CHECK_ENTITY_DATA, ed)) {
    const entity = ed as EntityData;
    // The API declares `yaml` as nullable.
    entity.yaml ??= '';
    return entity;
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching information of ${entityName}.`,
  );
  return null;
}
