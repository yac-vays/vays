/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionDecl } from '../../../../utils/types/api';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import editingState from '../../../state/EditCtrlState';

export function setMonacoYaml(e: any) {
  editingState.monacoyaml = e;
}

export function getMonacoYaml() {
  return editingState.monacoyaml;
}

export function setCurrentContext(e: RequestEditContext) {
  editingState.currentEditContext = e;
}

export function getCurrentContext() {
  return editingState.currentEditContext;
}

export function setEntityYAML(yaml: string) {
  editingState.entityYAML = yaml;
}

export function getEntityYAML() {
  return editingState.entityYAML;
}

export function getEntityName() {
  return editingState.entityName;
}

export function setEntityName(v: Nullable<string>) {
  editingState.entityName = v;
}

export function setActivatedActions(v: ActionDecl[]) {
  editingState.activatedActions = v;
}

export function getActivatedActions() {
  return editingState.activatedActions;
}

export function setIsValidatingCallback(cb: (v: boolean) => void) {
  editingState._setIsValidating = cb;
}

export function setIsValidating(v: boolean) {
  return editingState._setIsValidating(v);
}

export function setErrorMessageCallback(cb: (v: string) => void) {
  editingState._setErrorMessage = cb;
}

export function setErrorMessage(v: string) {
  return editingState._setErrorMessage(v);
}
