import { typeCheck } from 'type-check';
import { showError } from '../controller/global/notification';
import { getActionNames } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { entityToastTitle } from '../utils/toastUtils';
import { ActionDecl, APIValidateResponse, TYPE_CHECK_VALIDATE_RESP } from '../utils/types/api';
import { RequestEditContext } from '../utils/types/internal/request';
import { ValidateResponse } from '../utils/types/internal/validation';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { buildValidateRequestBody } from '../utils/validatorUtils';
import { handleYacResponse, yacErrorDetail } from './utils/handleYacResponse';

export const defaultValidationResponse: ValidateResponse = {
  json_schema: { type: 'object', required: [], properties: {} },
  ui_schema: { type: 'VerticalLayout', elements: [] },
  data: {},
  valid: false,
  detail: 'No form to display.',
  usages: [],
};

/**
 * The UI schema of a validation response for the form. YAC only builds a
 * layout once a field has a `vays_category`, so a type without any sends an
 * empty object: that is an empty form (the YAML editor still works), not bad
 * data.
 */
export function normalizeUiSchema(
  uiSchema: APIValidateResponse['schemas']['ui_schema'],
): ValidateResponse['ui_schema'] {
  if (
    uiSchema == null ||
    typeof uiSchema !== 'object' ||
    Array.isArray(uiSchema) ||
    typeof uiSchema.type !== 'string' ||
    !Array.isArray(uiSchema.elements)
  ) {
    return { type: 'VerticalLayout', elements: [] };
  }
  return uiSchema as ValidateResponse['ui_schema'];
}

export async function getSchema(
  requestEditContext: RequestEditContext,
): Promise<ValidateResponse | null> {
  return validate(requestEditContext.entityName ?? null, {}, requestEditContext, []);
}

export async function validateYAML(
  requestEditContext: RequestEditContext,
  name: Nullable<string>,
  yaml_new: string,
  yaml_old: string,
  acts: ActionDecl[],
) {
  const url = requestEditContext.rc.yacURL;

  if (url == null) return null;
  const obj = buildValidateRequestBody(
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
    errorMessage: 'Please contact the admin to resolve this issue.',
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
      ui_schema: normalizeUiSchema(dat.schemas.ui_schema),
      data: dat.schemas.data,
      valid: dat.request.valid && dat.schemas.valid,
      detail: dat.request.message ?? dat.schemas.message ?? '',
      ...(dat.schemas.validator ? { validator: dat.schemas.validator } : {}),
      usages: dat.usages ?? [],
      // Only carried when the backend reports it (older YACs do not), so
      // "no perms" stays distinguishable from "backend too old to say".
      ...(dat.perms ? { perms: dat.perms } : {}),
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
 * Validate the form's data.
 * @param name The entity name; null if there is none (yet) or YAC generates it.
 * @param actions Names of the actions to run with the write.
 */
export async function validate(
  name: Nullable<string>,
  data: object,
  requestEditContext: RequestEditContext,
  actions: string[],
  // The YAML the user is editing; the backend merges `data` into it (preserving
  // comments) instead of regenerating from data. Omit for initial loads.
  yamlBase?: string,
): Promise<ValidateResponse | null> {
  const url = requestEditContext.rc.yacURL;

  if (url == null) return null;
  const obj = buildValidateRequestBody(
    requestEditContext,
    data,
    name,
    actions,
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
