import { diffToastLink } from '../controller/global/diffViewer';
import { showError, showSuccess } from '../controller/global/notification';
import { actionNames2URLQuery } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { RequestEditContext } from '../utils/types/internal/request';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse } from './utils/handleYacResponse';

/**
 * @param name
 * @param yaml
 * @param yaml_old
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

  const result = await handleYacResponse(resp, {
    backendTitle: requestEditContext.rc.backendObject?.title,
    errorTitle: `Cannot edit ${name}`,
    errorMessage: 'Please contact your admin on this issue. ',
    serverErrorSuffix: 'The data you entered is cached for now.',
  });

  if (result.kind === 'success') {
    // YAC answers with a `Diff` object; `patch` is the unified diff of the
    // commit. Tolerate a missing/JSON-less body (the toast then has no link).
    let patch: string | undefined;
    try {
      patch = ((await result.resp.json()) as { patch?: string })?.patch;
    } catch {
      patch = undefined;
    }
    showSuccess(
      `Edited ${name} successfully!`,
      'The entity was successfully edited.',
      diffToastLink(`Changes to '${name}'`, patch),
    );
    return true;
  } else if (result.kind === 'invalid-request') {
    showError(
      'Frontend Error',
      'Invalid specification used, cannot talk to YAC servers. Please report ID-NEW-SD-01.',
    );
  } else if (result.kind === 'client-error') {
    showError(
      `Client Error (Status ${result.status}) ${result.body.title}`,
      result.body.message ?? '',
    );
  }

  return false;
}
