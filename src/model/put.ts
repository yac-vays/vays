import { diffToastLink } from '../controller/global/diffViewer';
import { showError, showSuccess } from '../controller/global/notification';
import { actions2URLQuery } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle, operationSuccessText } from '../utils/toastUtils';
import { ActionDecl } from '../utils/types/api';
import { RequestEditContext } from '../utils/types/internal/request';
import { joinUrl } from '../utils/urlUtils';
import { handleYacResponse, yacErrorDetail } from './utils/handleYacResponse';

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
  acts: ActionDecl[],
): Promise<boolean> {
  if (requestEditContext.entityName == null) {
    showError('Frontend error', 'The name is missing. Please file a bug report!');
    return false;
  }
  const url = requestEditContext.rc.yacURL;
  if (url == null || url == undefined) {
    return false;
  }
  const resp = await sendRequest(
    joinUrl(
      url,
      `/entity/${requestEditContext.rc.entityTypeName}/${requestEditContext.entityName}${actions2URLQuery(acts)}`,
    ),
    'PUT',
    JSON.stringify({ name: name, yaml_old: yaml_old, yaml_new: yaml }),
  );

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestEditContext.rc, name),
    errorText: `Edit of ${name} failed`,
    errorMessage: 'Please contact your admin on this issue.',
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
      entityToastTitle(requestEditContext.rc, name),
      operationSuccessText(`Edit of ${name}`, acts),
      diffToastLink(`Changes to ${name}`, patch),
    );
    return true;
  } else if (result.kind === 'invalid-request') {
    showError(
      'Frontend Error',
      'Invalid specification used, cannot talk to YAC servers. Please report ID-NEW-SD-01.',
    );
  } else if (result.kind === 'client-error') {
    showError(
      entityToastTitle(requestEditContext.rc, name),
      yacErrorDetail(`Edit of ${name} failed`, result.status, result.body, 'Please try again.'),
    );
  }

  return false;
}
