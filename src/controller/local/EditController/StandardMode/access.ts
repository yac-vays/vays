import editingState from '../../../state/EditCtrlState';
import editStdModeState from '../../../state/EditStdCtrlState';

export function setIsCurrentlyEditingString(v: boolean): void {
  editStdModeState.userIsEditingString = v;
}

export function IsCurrentlyEditingString(): boolean {
  return editStdModeState.userIsEditingString;
}

export function setCurrentTab(v: number) {
  editStdModeState.currentTab = v;
}

export function getCurrentTab() {
  return editStdModeState.currentTab;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFormData(data: any, errors?: any[]) {
  if (errors != undefined && errors.length > 0) {
    editingState.isValidLocal = false;
  } else {
    editingState.isValidLocal = true;
  }
  editStdModeState.entityDataObject = data;
}

export function getLocalEntityData() {
  return editStdModeState.entityDataObject;
}
