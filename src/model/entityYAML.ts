import { showError } from '../controller/local/notification';
import { sendRequest } from '../utils/authRequest';
import { RequestEditContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';

export async function getYAML(
  name: string,
  requestEditContext: RequestEditContext,
): Promise<string | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null;
  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/${requestEditContext.rc.entityTypeName}/${name}/yaml`),
    'GET',
  );

  if (resp == null) {
    return null;
  }

  if (resp.status == 200) {
    const dat = await resp.json();

    return dat;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot get YAML (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return null;
  }

  return null;
}
