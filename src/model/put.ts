import { showError, showSuccess } from '../controller/global/notification';
import { actionNames2URLQuery } from '../utils/actionUtils';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { RequestEditContext } from '../utils/types/internal/request';
import { joinUrl } from '../utils/urlUtils';

/**
 * @param name
 * @param patch
 * @param requestEditContext
 * @returns
 */

export async function putYAMLEntity(
  name: string,
  yaml: string,
  yaml_old: string,
  requestEditContext: RequestEditContext,
  acts: string[],
): Promise<boolean> {
  if (requestEditContext.entityName == null) {
    showError('Frontend error', 'Name of entity is null. Please file a bug report!');
    return false;
  }
  const url = requestEditContext.rc.yacURL;
  if (url == null || url == undefined) {
    return false;
  }
  const resp = await sendRequest(
    joinUrl(
      url,
      `/entity/${requestEditContext.rc.entityTypeName}/${requestEditContext.entityName}${actionNames2URLQuery(acts)}`,
    ),
    'PUT',
    JSON.stringify({ name: name, yaml_old: yaml_old, yaml_new: yaml }),
  );

  // Network error
  if (resp == null) {
    return false;
  }

  if (resp.status == 200) {
    showSuccess(`Modified ${name} successfully!`, 'The entity was successfully modified.');
    return true;
  } else if (resp.status == 422) {
    showError(
      'Frontend Error',
      'Invalid specification used, cannot talk to YAC servers. Please report ID-NEW-SD-01.',
    );
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot update ${name} (Status ${resp.status})`),
      (ans.message ?? 'Please contact your admin on this issue. ') +
        'The data you entered is cached for now.',
    );
  } else if (hasAuthFailed(resp.status)) {
    // TODO
  } else if (resp.status >= 400) {
    const jresp = await resp.json();
    showError(`Client Error (Status ${resp.status})`, jresp['detail']);
  }

  return false;
}
