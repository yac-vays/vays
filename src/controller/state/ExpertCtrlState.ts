/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionDecl } from '../../utils/types/api';
import { RequestEditContext } from '../../utils/types/internal/request';

/**
 * Editing (expert mode) control state.
 */
class ExpertControlState {
  /**
   * The current edit context. It needs to be stored in the state since
   * it is required in the editor update plugin.
   */
  public currentEditContext: RequestEditContext | null = null;

  public monacoyaml: any = null;

  /**
   * YAML of the entity that is to be edited.
   */
  public entityYAML: string | undefined = undefined;

  public entityName: string | null = null;

  public activatedActions: ActionDecl[] = [];

  /**
   * Callback which sets the is Validating flag, needed for such indication.
   * Needs to be stored here since the model, which needs this, may be reused across
   * the lifespan of multiple editing frame components.
   */
  public _setIsValidating: (v: boolean) => void = () => {};

  /**
   * Callback which sets the error message in the editing frame. Stored here for the
   * same reason as stated above.
   */
  public _setErrorMessage: (v: string) => void = () => {};
}

const expertModeState = new ExpertControlState();
export default expertModeState;
