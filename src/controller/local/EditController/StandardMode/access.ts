import editingState from '../../../state/EditCtrlState';

export function setIsCurrentlyEditingString(v: boolean): void {
  editingState.userIsEditingString = v;
}

export function IsCurrentlyEditingString(): boolean {
  return editingState.userIsEditingString;
}

export function setCurrentTab(v: number) {
  editingState.currentTab = v;
}

export function getCurrentTab() {
  return editingState.currentTab;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFormData(data: any, errors?: any[]) {
  if (errors != undefined && errors.length > 0) {
    editingState.isValidLocal = false;
  } else {
    editingState.isValidLocal = true;
  }
  editingState.entityDataObject = data;
}
