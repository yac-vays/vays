import { RequestEditContext } from '../utils/types/internal/request';
import { showError, showSuccess } from '../controller/local/notification';
import { sendRequest, authFailed } from '../utils/authRequest';

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
): Promise<boolean> {
  if (requestEditContext.entityName == null) {
    showError('Frontend error', 'Name of entity is null. Please file a bug report!');
    return false;
  }
  const resp = await sendRequest(
    requestEditContext.rc.yacURL +
      `/entity/${requestEditContext.rc.entityTypeName}/${requestEditContext.entityName}`,
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
  } else if (authFailed(resp.status)) {
    // TODO
  } else if (resp.status >= 400) {
    const jresp = await resp.json();
    showError(`Client Error (Status ${resp.status})`, jresp['detail']);
  }

  return false;
}
