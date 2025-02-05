import { showError } from '../controller/local/notification';
import { actions2URLQuery } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { ActionDecl } from '../utils/types/api';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';

export async function linkEntity(
  entityName: string,
  copyEntityName: string,
  actions: ActionDecl[],
  requestContext: RequestContext,
) {
  const url: string | null | undefined = requestContext.yacURL;

  if (url == undefined || url == null) return false;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}${actions2URLQuery(actions)}`),
    'POST',
    JSON.stringify({ name: entityName, link: copyEntityName }),
  );
  if (resp == null) return false;

  if (resp?.status == 201) return true;
  if (resp?.status >= 400) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Cannot Link ${entityName} (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return null;
  }

  return false;
}
