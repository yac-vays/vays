/* eslint-disable @typescript-eslint/no-explicit-any */
import { Nullable } from '../../../../utils/types/typeUtils';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import editingState from '../../../state/EditCtrlState';

export let currentEditContext: RequestEditContext | null = null;

export let monacoyaml: any = null;

export function setMonacoYaml(e: any) {
  monacoyaml = e;
}

export function getMonacoYaml() {
  return monacoyaml;
}

export function setCurrentContext(e: RequestEditContext) {
  currentEditContext = e;
}

export function getCurrentContext() {
  return currentEditContext;
}

export function setEntityYAML(yaml: string) {
  editingState.entityYAML = yaml;
}

export function getEntityYAML() {
  return editingState.entityYAML;
}

export function getOldYAML() {
  return editingState.initialYAML;
}

export function getEntityName() {
  return editingState.entityName;
}

export function setEntityName(v: Nullable<string>) {
  editingState.entityName = v;
}
