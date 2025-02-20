import { showError, showSuccess } from '../controller/global/notification';
import { handleCollision } from '../controller/local/EditController/StandardMode/concurrency';
import { handleAuthFailed } from '../session/login/tokenHandling';
import { actionNames2URLQuery } from '../utils/actionUtils';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { dumpEditActions, popActions } from '../utils/schema/injectActions';
import { RequestEditContext } from '../utils/types/internal/request';
import { joinUrl } from '../utils/urlUtils';

/**
 * @param name
 * @param patch
 * @param requestEditContext
 * @returns
 */

export async function patchEntity(
  name: string,
  patch: { [key: string]: unknown },
  requestEditContext: RequestEditContext,
  oldYaml?: string,
): Promise<boolean> {
  if (requestEditContext.entityName == null) {
    showError('Frontend error', 'Name of entity is null. Please file a bug report!');
    return false;
  }

  const url = requestEditContext.rc.yacURL;
  if (url == null || url == undefined) {
    return false;
  }

  const editActions = popActions(patch, requestEditContext.rc);
  const resp = await sendRequest(
    joinUrl(
      url,
      `/entity/${requestEditContext.rc.entityTypeName}/${
        requestEditContext.entityName
      }${actionNames2URLQuery(dumpEditActions(editActions))}`,
    ),
    'PATCH',
    JSON.stringify({ name: name, data: patch, yaml_old: oldYaml ?? null }),
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
  } else if (resp.status == 409) {
    // concurrency issue: someone has changed the file while this user has been editing.
    handleCollision(name, patch, requestEditContext, oldYaml);
    return false;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot update ${name} (Status ${resp.status})`),
      (ans.message ?? 'Please contact your admin on this issue. ') +
        'The data you entered is cached for now.',
    );
  } else if (hasAuthFailed(resp.status)) {
    handleAuthFailed();
  } else if (resp.status >= 400) {
    const jresp = await resp.json();
    showError(`Client Error (Status ${resp.status}) ${jresp.title}`, jresp.message);
  }

  return false;
}
