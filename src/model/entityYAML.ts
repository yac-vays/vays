import { RequestEditContext } from '../utils/types/internal/request';
import { showError } from '../controller/local/notification';
import { sendRequest } from '../utils/authRequest';
import { Nullable } from '../utils/types/typeUtils';

export async function getYAML(
  name: string,
  requestEditContext: RequestEditContext,
): Promise<string | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null; //structuredClone(defaultValidationResponse);
  // if (name != null){
  //     name = `"${name}"`;
  // }

  //`{"operation": "create", "type": "${requestContext.entityTypeName}", "actions": [], "name": ${originalName}, "entity": {"name": ${name}, "yaml":${JSON.stringify(JSON.stringify(data))}}}`
  const resp: Nullable<Response> = await sendRequest(
    url + `/${requestEditContext.rc.entityTypeName}/${name}/yaml`,
    'GET',
  );

  if (resp == null) {
    return null; //structuredClone(defaultValidationResponse);
  }

  if (resp.status == 200) {
    const dat = await resp.json();
    console.log('Validate success');

    return dat;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot get YAML (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    // let ret: ValidateResponse = structuredClone(defaultValidationResponse);
    // ret.detail = "Internal Server Error - no Schema to display.";
    return null; //ret;
  }

  return null;
}
