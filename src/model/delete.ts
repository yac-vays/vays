import { actions2URLQuery } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle } from '../utils/toastUtils';
import { ActionDecl } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse } from './utils/handleYacResponse';

/**
 * Delete an entity, optionally triggering the given delete-actions alongside.
 * @returns `true` on success, `null` when an error was already reported
 * (toast / re-login flow), `false` otherwise.
 */
export async function deleteEntity(
  entityName: string,
  requestContext: RequestContext,
  actions: ActionDecl[] = [],
): Promise<Nullable<boolean>> {
  const url: string | null | undefined = requestContext.yacURL;

  if (url == undefined || url == null) return false;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(
      url,
      `/entity/${requestContext.entityTypeName}/${entityName}${actions2URLQuery(actions)}`,
    ),
    'DELETE',
  );

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestContext, entityName),
    errorText: `Delete of ${entityName} failed`,
    errorMessage: 'Please contact the admin to resolve this issue.',
    successStatus: 204,
    genericClientErrors: true,
  });

  if (result.kind === 'success') return true;
  if (result.kind === 'network-error') return false;
  // The error was already reported (toast or re-login flow).
  return null;
}
