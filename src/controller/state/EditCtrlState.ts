/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';

/**
 * Editing controll state.
 */
class EditControllState {
  /**
   * The data of the entity as object.
   */
  public entityDataObject: any = {};

  /**
   * YAML of the entity that is to be edited.
   */
  public entityYAML: string | undefined = undefined;

  /**
   * Whether the most recent validation has returned, that the data is valid.
   */
  public isValidYAC: boolean = false;

  /**
   * The most recent YAC response.
   */
  public yacResponse: string = '';

  /**
   * Whether the most recent local validation has worked out.
   */
  public isValidLocal: boolean = false;

  /**
   * The Ajv object used for inserting the defaults.
   */
  readonly ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });

  /**
   * The object containing all defaults for the schema of the most recent validation.
   */
  public previousDefaultsObject: any = null;

  /**
   * The data as it was received before any editing has taken place.
   */
  public initialData: any = {};

  /**
   * The most recently fetched YAML file content
   */
  public initialYAML: string = '';

  /**
   * Whether the user is currently editing a string. Needed to adjust the loading indicator.
   */
  public userIsEditingString: boolean = false;

  /**
   * The current tab index which is required to make the setting persistent over several
   * schema rerenders.
   */
  public currentTab: number = 0;

  public entityName: string | null = null;
}

const editingState = new EditControllState();
export default editingState;
