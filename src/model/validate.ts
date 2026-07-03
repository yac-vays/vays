import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { getActionNames } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { dumpEditActions, EditActionSnapshot, NO_ACTIONS } from '../utils/schema/injectActions';
import { entityToastTitle } from '../utils/toastUtils';
import { ActionDecl, APIValidateResponse, TYPE_CHECK_VALIDATE_RESP } from '../utils/types/api';
import { RequestEditContext } from '../utils/types/internal/request';
import { ValidateResponse } from '../utils/types/internal/validation';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { stringifyEntityInfoForAPI } from '../utils/validatorUtils';
import { handleYacResponse, yacErrorDetail } from './utils/handleYacResponse';

export const defaultValidationResponse: ValidateResponse = {
  json_schema: { type: 'object', required: [], properties: {} },
  ui_schema: { type: 'VerticalLayout', elements: [] },
  data: {},
  valid: false,
  detail: 'Sorry, there is no form to display (yet)...',
  usages: [],
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

  const result = await handleYacResponse(resp, {
    title: entityToastTitle(requestEditContext.rc, requestEditContext.entityName),
    errorText: 'Validation failed',
    errorMessage: 'Waking up the admin, please stand by...',
  });

  if (result.kind === 'success') {
    const dat = typeCheckValidationResponse(await result.resp.json());
    if (!dat) return null;

    // A located error only makes sense for a *schema* failure (the displayed
    // `detail` is then the schema message). Request-level failures (perms,
    // conflicts, limits) have no location and stay in the footer status bar.
    const isSchemaError = dat.request.valid && !dat.schemas.valid;

    return {
      json_schema: dat.schemas.json_schema,
      ui_schema: dat.schemas.ui_schema,
      data: dat.schemas.data,
      valid: dat.request.valid && dat.schemas.valid,
      detail: dat.request.message ?? dat.schemas.message ?? '',
      usages: dat.usages ?? [],
      // Canonical YAML the backend would write for this data (comments
      // preserved). Lets the YAML editor mirror the form without us having to
      // re-implement YAC's ruamel serialization. Only carried when present, so
      // responses without it keep their existing shape.
      ...(dat.schemas.yaml ? { yaml: dat.schemas.yaml } : {}),
      // Only carry a location for an actual schema error, so other responses
      // keep their existing shape (and the footer stays the fallback).
      ...(isSchemaError && {
        data_loc: dat.schemas.data_loc,
        json_schema_loc: dat.schemas.json_schema_loc,
      }),
    };
  } else if (result.kind === 'invalid-request') {
    showError('Frontend Error', 'Invalid specification used, cannot talk to YAC servers.');
  } else if (result.kind === 'client-error') {
    showError(
      entityToastTitle(requestEditContext.rc, requestEditContext.entityName),
      yacErrorDetail('Validation failed', result.status, result.body, 'Please try again.'),
    );
  }

  return null;
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
  // The YAML the user is editing; the backend merges `data` into it (preserving
  // comments) instead of regenerating from data. Omit for initial loads.
  yamlBase?: string,
): Promise<ValidateResponse | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null;
  const obj = stringifyEntityInfoForAPI(
    requestEditContext,
    data,
    name,
    dumpEditActions(editActions),
    undefined,
    undefined,
    yamlBase,
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
