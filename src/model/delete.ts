import { sendRequest } from '../utils/authRequest';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse } from './utils/handleYacResponse';

/**
 * Delete an entity.
 * @returns `true` on success, `null` when an error was already reported
 * (toast / re-login flow), `false` otherwise.
 */
export async function deleteEntity(
  entityName: string,
  requestContext: RequestContext,
): Promise<Nullable<boolean>> {
  const url: string | null | undefined = requestContext.yacURL;

  if (url == undefined || url == null) return false;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}`),
    'DELETE',
  );

  const result = await handleYacResponse(resp, {
    backendTitle: requestContext.backendObject?.title,
    errorTitle: `Could not delete entity ${entityName}`,
    errorMessage: 'Could not delete entity. Please contact the admin to resolve this issue.',
    successStatus: 204,
    genericClientErrors: true,
  });

  if (result.kind === 'success') return true;
  if (result.kind === 'network-error') return false;
  // The error was already reported (toast or re-login flow).
  return null;
}
