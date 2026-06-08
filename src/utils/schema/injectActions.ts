import { ActionDecl } from '../types/api';

/**
 * A snapshot of the triggerable actions a user has (de)selected. Keys are
 * arbitrary; only `action.name` and `dataEntryValue` are read.
 */
export type EditActionSnapshot = { [key: string]: { action: ActionDecl; dataEntryValue: boolean } };

export const NO_ACTIONS: EditActionSnapshot = {};

/** The names of the activated actions in a snapshot. */
export function dumpEditActions(actions: EditActionSnapshot): string[] {
  const selectedActions = Object.keys(actions)
    .map((actEntry) => {
      if (actions[actEntry].dataEntryValue) {
        return actions[actEntry].action.name;
      }
      return undefined;
    })
    .filter((v) => v !== undefined);

  return selectedActions;
}
