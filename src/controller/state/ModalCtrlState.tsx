import { ModalCallback } from '../../view/components/Modal/ModalContext';
import { Nullable } from '../../utils/types/typeUtils';

/**
 * The State for the Modal controller.
 */
class ModalControllState {
  /**
   * The calback for displaying the modal.
   * Internal use only - no modal component access.
   */
  public modalCallback: Nullable<ModalCallback> = null;
}

const modalCtrlState = new ModalControllState();
export default modalCtrlState;
