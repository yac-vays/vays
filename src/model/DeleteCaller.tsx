import { RequestContext } from '../controller/global/URLValidation';
import { Nullable } from '../utils/typeUtils';
import { sendRequest } from '../utils/AuthedRequest';
import { showError } from '../controller/local/ErrorNotifyController';

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
