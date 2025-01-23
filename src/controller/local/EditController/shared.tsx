import { navigateToURL, RequestEditContext } from '../../global/URLValidation';
import { getSchema, ValidateResponse } from '../../../model/ValidatorClient';
import { NameGeneratedCond } from '../../../model/EntityListFetcher';
import { Nullable } from '../../../utils/typeUtils';
import { getEntityData } from '../../../model/EntityDataFetcher';
import editingState from '../../state/EditCtrlState';
import { injectSettableName } from '../../../schema/injectName';
import { insertDefaults, mergeDefaults } from '../../../schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../schema/injectActions';
import { updateSchema } from './StandardMode/StandardEditController';

export async function retreiveSchema(
  requestEditContext: RequestEditContext,
  preventInjectName: boolean = false,
  preventInjectActions: boolean = false,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;

  if (requestEditContext.mode === 'create') {
    return await retreiveNewCreateSchema(
      requestEditContext,
      preventInjectName,
      preventInjectActions,
    );
  }

  return await retreiveEditSchema(requestEditContext, preventInjectName, preventInjectActions);
}

async function retreiveEditSchema(
  requestEditContext: RequestEditContext,
  preventInjectName: boolean = false,
  preventInjectActions: boolean = false,
): Promise<ValidateResponse | null> {
  console.log('Edit Controller [RECV]: Got request to get UPDATE schema');
  if (requestEditContext.entityName == null) return null;

  const entityData = await getEntityData(requestEditContext.entityName, requestEditContext.rc);
  if (entityData == null) {
    return null;
  }
  const editActions = popActions({}, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext, editActions);
  if (valResp == null) {
    return null;
  }
  if (!preventInjectActions) {
    valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  }
  valResp.yaml = entityData.yaml;
  valResp.data = entityData?.data;

  setInitialEntityYAML(entityData.yaml);
  editingState.initialData = structuredClone(valResp.data);

  mergeDefaults(valResp);
  if (
    preventInjectName ||
    requestEditContext.rc.accessedEntityType?.name_generated == NameGeneratedCond.enforced
  ) {
    return valResp;
  }

  return injectSettableName(valResp, requestEditContext.rc, requestEditContext.entityName);
}

async function retreiveNewCreateSchema(
  requestEditContext: RequestEditContext,
  preventInjectName: boolean = false,
  preventInjectActions: boolean = false,
): Promise<ValidateResponse | null> {
  console.log('Edit Controller [RECV]: Got request to get initial schema');
  console.log(requestEditContext);
  const editActions = popActions({}, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext, editActions);
  if (valResp == null) {
    return null;
  }

  console.error(requestEditContext);
  if (!preventInjectActions) {
    valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  }
  console.error('Edit Controller [RECV]: Got schema');

  console.log(valResp);

  insertDefaults(valResp);

  console.error(requestEditContext);
  return await updateSchema(valResp.data, requestEditContext, false, false);
  // if (valResp == null) return null;
  // if (
  //   preventInjectName ||
  //   requestEditContext.rc.accessedEntityType?.name_generated == NameGeneratedCond.enforced
  // ) {
  //   return valResp;
  // }
  // console.log('INITIAL');

  // return injectSettableName(valResp, requestEditContext.rc, requestEditContext.entityName ?? null);
}

export function editViewNavigateToNewName(
  name: Nullable<string>,
  requestEditContext: RequestEditContext,
) {
  if (
    requestEditContext.mode == 'create' &&
    // This fixes the latent redirect when the user just navigated away
    window.location.pathname.startsWith(
      `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}`,
    )
  ) {
    if (name != null) {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/${name}?mode=${requestEditContext.viewMode}`,
      );
    } else {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/?mode=${requestEditContext.viewMode}`,
      );
    }
  }
}

export function setYACValidateResponse(yacResponse: string) {
  editingState.yacResponse = yacResponse;
}

export function setYACValidStatus(valid: boolean) {
  editingState.isValidYAC = valid;
}

export function getYACValidateResponse() {
  return editingState.yacResponse;
}

export function getInitialEntityYAML() {
  return editingState.initialYAML;
}

export function setInitialEntityYAML(yaml: string) {
  editingState.initialYAML = yaml;
}
