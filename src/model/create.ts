import { stringify } from 'yaml';
import { showError, showSuccess } from '../controller/global/notification';
import { handleAuthFailed } from '../session/login/tokenHandling';
import { actionNames2URLQuery } from '../utils/actionUtils';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';

export async function createNewEntity(
  name: Nullable<string>,
  data: { [key: string]: unknown },
  requestContext: RequestContext,
  yaml?: string,
  acts: string[] = [],
): Promise<boolean> {
  const content =
    JSON.stringify(yaml) ??
    JSON.stringify(`---\n# Automatically generated by VAYS\n\n${stringify(data)}`);
  const url = requestContext.yacURL;
  if (url == null || url == undefined) return false;

  const stringName: string = name == null ? 'null' : `"${name}"`;
  const resp = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}${actionNames2URLQuery(acts)}`),
    'POST',
    `{"name": ${stringName}, "yaml":${content}}`,
  );

  // Network error
  if (resp == null) {
    return false;
  }

  if (resp.status == 201) {
    showSuccess(
      `Created ${name} successfully!`,
      'The entity was successfully created and added to the repository.',
    );
    return true;
  } else if (resp.status == 422) {
    showError(
      'Frontend Error',
      'Invalid specification used, cannot talk to YAC servers. Please report ID-NEW-SD-01.',
    );
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Cannot create ${name} (Status ${resp.status})`),
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
