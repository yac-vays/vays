import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle } from '../utils/toastUtils';
import { EntityData, TYPE_CHECK_ENTITY_DATA } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse, yacErrorDetail } from './utils/handleYacResponse';

export async function getEntityData(
  entityName: string,
  requestContext: RequestContext,
): Promise<EntityData | null> {
  const url: string | null | undefined = requestContext.yacURL;
  if (url == null || url == undefined) return null;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}`),
    'GET',
  );

  if (resp == null) {
    showError(
      entityToastTitle(requestContext, entityName),
      `Read of ${entityName} failed: the backend could not be reached.`,
    );
    return null;
  }

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestContext, entityName),
    errorText: `Read of ${entityName} failed`,
    errorMessage: 'Please contact the admin to resolve this issue.',
  });

  if (result.kind === 'success') {
    return typeCheckEntityData(await result.resp.json(), entityName);
  } else if (result.kind === 'invalid-request') {
    // No validation error should happen here.
    showError('Internal Error', 'Error ID-VAL-GED-01. Please file a bug report.');
  } else if (result.kind === 'client-error') {
    showError(
      entityToastTitle(requestContext, entityName),
      yacErrorDetail(
        `Read of ${entityName} failed`,
        result.status,
        result.body,
        'Please try again.',
      ),
    );
  }
  return null;
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
  const url: string | null | undefined = requestContext.yacURL;
  if (url == null || url == undefined) return { kind: 'error' };

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}`),
    'GET',
  );
  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestContext, entityName),
    errorText: `Read of ${entityName} failed`,
    errorMessage: 'Please contact the admin to resolve this issue.',
  });

  if (result.kind === 'success') {
    const entity = typeCheckEntityData(await result.resp.json(), entityName);
    return entity == null ? { kind: 'error' } : { kind: 'found', entity };
  }
  if (result.kind === 'client-error' && result.status === 404) return { kind: 'gone' };
  if (result.kind === 'network-error') {
    showError(
      entityToastTitle(requestContext, entityName),
      `Read of ${entityName} failed: the backend could not be reached.`,
    );
  } else if (result.kind === 'client-error' || result.kind === 'invalid-request') {
    showError(
      entityToastTitle(requestContext, entityName),
      yacErrorDetail(
        `Read of ${entityName} failed`,
        result.status,
        result.body,
        'Please try again.',
      ),
    );
  }
  return { kind: 'error' };
}

function typeCheckEntityData(ed: unknown, entityName: string): Nullable<EntityData> {
  if (typeCheck(TYPE_CHECK_ENTITY_DATA, ed)) {
    return ed as EntityData;
  }
  showError(
    'Received bad data from Backend',
    `Received bad data when fetching information of ${entityName}.`,
  );
  return null;
}
