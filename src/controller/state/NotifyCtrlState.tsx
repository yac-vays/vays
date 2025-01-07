import { ToastCallback } from '../../view/components/ToastNotification/ToastContext';
import { Nullable } from '../../utils/typeUtils';

/**
 * The State for the Notification controller.
 */
class NotifyCtrlState {
  /**
   * The callback for displaying the notification panel.
   * Internal use only - no view component access.
   */
  public notifyCallback: Nullable<ToastCallback> = null;

  /**
   * Buffer for messages.
   */
  public callbackBuffer: string[][] = [];
}

const notifyCtrlState = new NotifyCtrlState();
export default notifyCtrlState;
