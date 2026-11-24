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
