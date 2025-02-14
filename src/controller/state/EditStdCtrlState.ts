/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Editing (expert mode) control state.
 */
class EditStdControlState {
  /**
   * The data of the entity as object.
   */
  public entityDataObject: any = {};

  /**
   * Whether the user is currently editing a string. Needed to adjust the loading indicator.
   */
  public userIsEditingString: boolean = false;

  /**
   * The current tab index which is required to make the setting persistent over several
   * schema rerenders.
   */
  public currentTab: number = 0;
}

const editStdModeState = new EditStdControlState();
export default editStdModeState;
