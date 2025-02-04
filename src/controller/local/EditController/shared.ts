import editingState from '../../state/EditCtrlState';
import { navigateToURL } from '../../global/url';
import { updateSchema } from './StandardMode';
import { getEntityData } from '../../../model/entityData';
import { getSchema } from '../../../model/validate';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { NameGeneratedCond } from '../../../utils/types/api';
import { Nullable } from '../../../utils/types/typeUtils';
import { injectSettableName } from '../../../utils/schema/injectName';
import { insertDefaults, mergeDefaults } from '../../../utils/schema/defaultsHandling';
import { injectAction, insertActionData, popActions } from '../../../utils/schema/injectActions';

export async function retreiveSchema(
  requestEditContext: RequestEditContext,
  preventInjectName: boolean = false,
  preventInjectActions: boolean = false,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;
  setYACValidateResponse('');
  setYACValidStatus(true);

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
  const editActions = popActions({}, requestEditContext.rc);

  let valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext, editActions);
  if (valResp == null) {
    return null;
  }

  if (!preventInjectActions) {
    valResp = insertActionData(injectAction(valResp, requestEditContext), editActions);
  }

  insertDefaults(valResp);

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
