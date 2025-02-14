/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionDecl } from '../../../../utils/types/api';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { Nullable } from '../../../../utils/types/typeUtils';
import expertModeState from '../../../state/ExpertCtrlState';

export function setMonacoYaml(e: any) {
  expertModeState.monacoyaml = e;
}

export function getMonacoYaml() {
  return expertModeState.monacoyaml;
}

export function setCurrentContext(e: RequestEditContext) {
  expertModeState.currentEditContext = e;
}

export function getCurrentContext() {
  return expertModeState.currentEditContext;
}

export function setEntityYAML(yaml: string) {
  expertModeState.entityYAML = yaml;
}

export function getEntityYAML() {
  return expertModeState.entityYAML;
}

export function getEntityName() {
  return expertModeState.entityName;
}

export function setEntityName(v: Nullable<string>) {
  expertModeState.entityName = v;
}

export function setActivatedActions(v: ActionDecl[]) {
  expertModeState.activatedActions = v;
}

export function getActivatedActions() {
  return expertModeState.activatedActions;
}

export function setIsValidatingCallback(cb: (v: boolean) => void) {
  expertModeState._setIsValidating = cb;
}

export function setIsValidating(v: boolean) {
  return expertModeState._setIsValidating(v);
}

export function setErrorMessageCallback(cb: (v: string) => void) {
  expertModeState._setErrorMessage = cb;
}

export function setErrorMessage(v: string) {
  return expertModeState._setErrorMessage(v);
}
