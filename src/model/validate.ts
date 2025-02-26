/* eslint-disable @typescript-eslint/no-explicit-any */
import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { handleAuthFailed } from '../session/login/tokenHandling';
import { getActionNames } from '../utils/actionUtils';
import { hasAuthFailed, sendRequest } from '../utils/authRequest';
import { dumpEditActions, EditActionSnapshot, NO_ACTIONS } from '../utils/schema/injectActions';
import { ActionDecl, APIValidateResponse, TYPE_CHECK_VALIDATE_RESP } from '../utils/types/api';
import { RequestEditContext } from '../utils/types/internal/request';
import { ValidateResponse } from '../utils/types/internal/validation';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { stringifyEntityInfoForAPI } from '../utils/validatorUtils';

export const defaultValidationResponse: ValidateResponse = {
  json_schema: { type: 'object', required: [], properties: {} },
  ui_schema: { type: 'VerticalLayout', elements: [] },
  data: {},
  valid: false,
  detail: 'Sorry, there is no form to display (yet)...',
};

export async function getSchema(
  requestEditContext: RequestEditContext,
): Promise<ValidateResponse | null> {
  return validate(requestEditContext.entityName ?? null, {}, requestEditContext, NO_ACTIONS);
}

export async function validateYAML(
  requestEditContext: RequestEditContext,
  name: Nullable<string>,
  yaml_new: string,
  yaml_old: string,
  acts: ActionDecl[],
) {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null;
  const obj = stringifyEntityInfoForAPI(
    requestEditContext,
    undefined,
    name,
    getActionNames(acts),
    yaml_new,
    yaml_old,
  );

  return await _validate(requestEditContext, url, obj);
}

async function _validate(
  requestEditContext: RequestEditContext,
  url: string,
  obj: string,
): Promise<ValidateResponse | null> {
  const resp: Nullable<Response> = await sendRequest(joinUrl(url, `/validate`), 'POST', obj);

  if (resp == null) {
    return null;
  }

  if (resp.status == 200) {
    const dat = typeCheckValidationResponse(await resp.json());
    if (!dat) return null;

    return {
      json_schema: dat.schemas.json_schema,
      ui_schema: dat.schemas.ui_schema,
      data: dat.schemas.data,
      valid: dat.request.valid && dat.schemas.valid,
      detail: dat.request.message ?? dat.schemas.message ?? '',
    };
  } else if (resp.status == 422) {
    showError('Frontend Error', 'Invalid specification used, cannot talk to YAC servers.');
    return null;
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot validate YAML (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    return null;
  } else if (hasAuthFailed(resp.status)) {
    const ans = await resp.json();
    handleAuthFailed(ans.title, ans.message);
    return null;
  }

  return resp.json().then((body) => {
    showError('Cannot fetch schema', `Server responded with "${body.message}"`);
    return null;
  });
}

/**
 * Validate the data object.
 * @param name The name of the entity. Maybe null, especially if YAC is required to generate the name.
 * @param data some data object.
 * @param requestEditContext the request context
 * @param editActions
 * @returns
 */
export async function validate(
  name: Nullable<string>,
  data: object,
  requestEditContext: RequestEditContext,
  editActions: EditActionSnapshot,
): Promise<ValidateResponse | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null;
  const obj = stringifyEntityInfoForAPI(
    requestEditContext,
    data,
    name,
    dumpEditActions(editActions),
  );

  return await _validate(requestEditContext, url, obj);
}

function typeCheckValidationResponse(vr: unknown): Nullable<APIValidateResponse> {
  if (typeCheck(TYPE_CHECK_VALIDATE_RESP, vr)) {
    return vr as APIValidateResponse;
  }
  showError('Received bad data from Backend', `Received bad data when validating.`);

  return null;
}
