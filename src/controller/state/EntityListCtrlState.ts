import { Nullable } from '../../utils/typeUtils';

/**
 * The State for the EntityList controller.
 */
class ELCState {
  /**
   * The scroll container for the data table.
   */
  public scrollContainer: Nullable<React.RefObject<HTMLDivElement>> = null;
}

const entityListCtrlState = new ELCState();
export default entityListCtrlState;
