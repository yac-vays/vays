import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { sendRequest } from '../utils/authRequest';
import { showError } from '../controller/local/notification';

export async function deleteEntity(entityName: string, requestContext: RequestContext) {
  const url: string | null | undefined = requestContext.yacURL;

  if (url == undefined || url == null) return false;

  // TODO: Do a proper URL joining utility!
  // TODO: Add the possibility to check status, declare the desired status, and else do error logging.
  const resp: Nullable<Response> = await sendRequest(
    url + `/entity/${requestContext.entityTypeName}/${entityName}`,
    'DELETE',
  );
  if (resp == null) return false;
  if (resp?.status == 204) return true;

  if (resp?.status >= 400) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Could not delete entity ${entityName} (Status ${resp.status})`),
      ans.message ?? 'Could not delete entity. Please contact the admin to resolve this issue.',
    );
    return null;
  }
  return false;
}
