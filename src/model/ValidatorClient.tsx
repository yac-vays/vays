/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema } from '@jsonforms/core';
import { showError, showSuccess } from '../controller/local/ErrorNotifyController';
import {
  navigateToURL,
  RequestContext,
  RequestEditContext,
} from '../controller/global/URLValidation';
import { Nullable } from '../utils/typeUtils';
import { authFailed, sendRequest } from '../utils/AuthedRequest';
import { stringify } from 'yaml';
import { NameGeneratedCond } from './EntityListFetcher';
import { dumpEditActions, EditActionSnapshot, popActions } from '../schema/injectActions';
import { actionNames2URLQuery } from '../utils/actionUtils';

export type ValidateResponse = {
  json_schema: JsonSchema;
  // json_schema : {
  //     //type : string,
  //     required : string[],
  //     properties : any,
  //     [key: string] : any
  // };
  ui_schema: {
    type: string;
    elements: {
      type: string;
      label: string;
      elements: any[];
    }[];
  };
  data: { [key: string]: any };
  valid: boolean;
  detail: string;
  yaml?: string;
};

export interface NewValidateReponse {
  schemas: {
    json_schema: JsonSchema;
    ui_schema: {
      type: string;
      elements: {
        type: string;
        label: string;
        elements: any[];
      }[];
    };

    data: { [key: string]: any };
    valid: boolean;
    message?: string;
    // which component has failed (format, required, ...)
    validator: string;
    json_schema_loc: string;
    doc_loc: string;
  };

  request: {
    valid: boolean;
    message?: string;
  };
}

export const defaultValidationResponse: ValidateResponse = {
  json_schema: { type: 'object', required: [], properties: {} },
  ui_schema: { type: 'VerticalLayout', elements: [] },
  data: {},
  valid: false,
  detail: 'Sorry, there is no form to display (yet)...',
};

function getEntityObject(
  requestEditContext: RequestEditContext,
  data: any = {},
  name: Nullable<string> = null,
  actions: string[] = [],
  yaml_new?: string,
  yaml_old?: string,
) {
  if (
    requestEditContext.mode === 'create' &&
    requestEditContext.rc.accessedEntityType?.name_generated === NameGeneratedCond.enforced
  ) {
    name = null;
  } else if (
    requestEditContext.rc.accessedEntityType?.name_generated === NameGeneratedCond.enforced
  ) {
    name = requestEditContext.entityName ?? null;
  }
  if (requestEditContext.viewMode === 'expert') {
    // YAML editor (Expert mode)

    if (requestEditContext.mode === 'modify') {
      return JSON.stringify({
        operation: 'change',
        type: requestEditContext.rc.entityTypeName,
        actions: actions,
        name: requestEditContext.entityName ?? null,
        entity: {
          name: name,
          yaml_new: yaml_new ?? '',
          yaml_old: yaml_old ?? '',
        },
      });
    } else {
      return JSON.stringify({
        operation: 'create',
        type: requestEditContext.rc.entityTypeName,
        actions: actions,
        name: null,
        entity: {
          name: name,
          yaml: yaml_new ?? '',
        },
      });
    }
  } else if (requestEditContext.mode === 'create') {
    // CreateEntity
    return JSON.stringify({
      operation: 'create',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: null,
      entity: {
        name: name,
        yaml: JSON.stringify(data),
      },
    });
  } else if (requestEditContext.mode === 'modify') {
    return JSON.stringify({
      operation: 'change',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: requestEditContext.entityName ?? null,
      entity: {
        name: name,
        data: data,
      },
    });
  }
}

export async function getSchema(
  requestEditContext: RequestEditContext,
  editActions: EditActionSnapshot,
): Promise<ValidateResponse | null> {
  return validate(requestEditContext.entityName ?? null, {}, requestEditContext, editActions);
}

export async function validateYAML(
  requestEditContext: RequestEditContext,
  name: Nullable<string>,
  yaml_new: string,
  yaml_old?: string,
): Promise<ValidateResponse | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null; //structuredClone(defaultValidationResponse);
  const obj = getEntityObject(requestEditContext, undefined, name, [], yaml_new, yaml_old);

  const resp: Nullable<Response> = await sendRequest(url + `/validate`, 'POST', obj);

  if (resp == null) {
    return null; //structuredClone(defaultValidationResponse);
  }

  if (resp.status == 200) {
    const dat = await resp.json();
    console.log('Validate success');

    return {
      json_schema: dat.schemas.json_schema,
      ui_schema: dat.schemas.ui_schema,
      data: dat.schemas.data,
      valid: dat.request.valid && dat.schemas.valid,
      detail: dat.request.message ?? dat.schemas.message ?? '',
    };

    // return insertActionData(injectAction(dat, requestEditContext), editActions);
  } else if (resp.status == 422) {
    showError('Frontend Error', 'Invalid specification used, cannot talk to YAC servers.');
    return null; //structuredClone(defaultValidationResponse);
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot validate YAML (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    // let ret: ValidateResponse = structuredClone(defaultValidationResponse);
    // ret.detail = "Internal Server Error - no Schema to display.";
    return null; //ret;
  } else if (authFailed(resp.status)) {
    // TODO

    return null;
  }

  //let ret: ValidateResponse = structuredClone(defaultValidationResponse);
  return resp.json().then((body) => {
    showError('Cannot fetch schema', `Server responded with "${body.message}"`);
    // ret.detail = body.detail;
    return null; // ret;
  });
}

/**
 *
 * @param name
 * @param data
 * @param requestContext
 * @param originalName = null. Leave null when creating a new entity.
 * @returns
 */
export async function validate(
  name: Nullable<string>,
  data: any,
  requestEditContext: RequestEditContext,
  editActions: EditActionSnapshot,
): Promise<ValidateResponse | null> {
  const url: string | null | undefined = requestEditContext.rc.yacURL;

  if (url == undefined || url == null) return null; //structuredClone(defaultValidationResponse);
  // if (name != null){
  //     name = `"${name}"`;
  // }

  //`{"operation": "create", "type": "${requestContext.entityTypeName}", "actions": [], "name": ${originalName}, "entity": {"name": ${name}, "yaml":${JSON.stringify(JSON.stringify(data))}}}`
  console.log('--------------> validate');
  console.log(data);
  console.log(name);
  console.log(requestEditContext);
  // const editActions = popActions(data, requestEditContext.rc);
  console.log('Edit action');
  console.log(editActions);
  const obj = getEntityObject(requestEditContext, data, name, dumpEditActions(editActions));

  const resp: Nullable<Response> = await sendRequest(url + `/validate`, 'POST', obj);

  if (resp == null) {
    return null; //structuredClone(defaultValidationResponse);
  }

  if (resp.status == 200) {
    const dat = (await resp.json()) as NewValidateReponse;
    console.log('Validate success');

    return {
      json_schema: dat.schemas.json_schema,
      ui_schema: dat.schemas.ui_schema,
      data: dat.schemas.data,
      valid: dat.request.valid && dat.schemas.valid,
      detail: dat.request.message ?? dat.schemas.message ?? '',
    };

    // return insertActionData(injectAction(dat, requestEditContext), editActions);
  } else if (resp.status == 422) {
    showError('Frontend Error', 'Invalid specification used, cannot talk to YAC servers.');
    return null; //structuredClone(defaultValidationResponse);
  } else if (resp.status >= 500) {
    const ans = await resp.json();
    showError(
      `${requestEditContext.rc.backendObject?.title}: ` +
        (ans.title ?? `Cannot validate ${name} (Status ${resp.status})`),
      ans.message ?? 'Waking up the admin, please stand by...',
    );
    // let ret: ValidateResponse = structuredClone(defaultValidationResponse);
    // ret.detail = "Internal Server Error - no Schema to display.";
    return null; //ret;
  } else if (authFailed(resp.status)) {
    // TODO
    const ans = await resp.json();
    showError(ans.title, ans.message);
    navigateToURL('/');

    return null;
  }

  //let ret: ValidateResponse = structuredClone(defaultValidationResponse);
  return resp.json().then((body) => {
    showError('Cannot fetch schema', `Server responded with "${body.message}"`);
    // ret.detail = body.detail;
    return null; // ret;
  });
}

export async function createNewEntity(
  name: Nullable<string>,
  data: any,
  requestContext: RequestContext,
  yaml?: string,
): Promise<boolean> {
  const editActions = popActions(data, requestContext);

  const content =
    JSON.stringify(yaml) ??
    JSON.stringify(`---\n# Automatically generated by VAYS\n\n${stringify(data)}`);

  const stringName: string = name == null ? 'null' : `\"${name}\"`;
  const resp = await sendRequest(
    requestContext.yacURL +
      `/entity/${requestContext.entityTypeName}${actionNames2URLQuery(
        dumpEditActions(editActions),
      )}`,
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
  } else if (authFailed(resp.status)) {
    // TODO
  } else if (resp.status >= 400) {
    const jresp = await resp.json();
    showError(`Client Error (Status ${resp.status})`, jresp['detail']);
  }

  return false;
}

/**
 * TODO: DO MORE TESTING FOR THOSE WITH ACTIONS.
 * @param name
 * @param patch
 * @param requestEditContext
 * @returns
 */
export async function patchEntity(
  name: string,
  patch: any,
  requestEditContext: RequestEditContext,
): Promise<boolean> {
  if (requestEditContext.entityName == null) {
    showError('Frontend error', 'Name of entity is null. Please file a bug report!');
    return false;
  }
  const editActions = popActions(patch, requestEditContext.rc);
  const resp = await sendRequest(
    requestEditContext.rc.yacURL +
      `/entity/${requestEditContext.rc.entityTypeName}/${
        requestEditContext.entityName
      }${actionNames2URLQuery(dumpEditActions(editActions))}`,
    'PATCH',
    JSON.stringify({ name: name, data: patch }),
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

/**
 * TODO: DO MORE TESTING FOR THOSE WITH ACTIONS.
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
