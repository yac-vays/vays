import { ToastCallback, ToastMode } from '../../view/components/ToastNotification/ToastContext';
import notifyCtrlState from '../state/NotifyCtrlState';

/**
 *
 * @param callback The notify display callback.
 */
export function registerErrorNotifyCallback(callback: ToastCallback) {
  notifyCtrlState.notifyCallback = callback;
  for (let oldMsg of notifyCtrlState.callbackBuffer) {
    notifyCtrlState.notifyCallback(ToastMode.ERROR, oldMsg[0], oldMsg[1]);
  }
}

/**
 * Show error toast.
 * @param title the title to display.
 * @param detail the message below, giving more detail.
 */
export function showError(title: string, detail: string) {
  if (notifyCtrlState.notifyCallback != null) {
    notifyCtrlState.notifyCallback(ToastMode.ERROR, title, detail);
  } else {
    notifyCtrlState.callbackBuffer.push([title, detail]);
  }
}

/**
 * Show success toast.
 * @param title the title to display.
 * @param detail the message below, giving more detail.
 */
export function showSuccess(title: string, detail: string) {
  if (notifyCtrlState.notifyCallback != null) {
    notifyCtrlState.notifyCallback(ToastMode.SUCCESS, title, detail);
  }
}
