import {
  ToastCallback,
  ToastLink,
  ToastMode,
} from '../../view/components/ToastNotification/ToastContext';
import notifyCtrlState from '../state/NotifyCtrlState';

/**
 *
 * @param callback The notify display callback.
 */
export function registerErrorNotifyCallback(callback: ToastCallback) {
  notifyCtrlState.notifyCallback = callback;
  for (const oldMsg of notifyCtrlState.callbackBuffer) {
    notifyCtrlState.notifyCallback(ToastMode.ERROR, oldMsg[0], oldMsg[1]);
  }
  // Drop the replayed messages so a later remount does not re-toast old errors.
  notifyCtrlState.callbackBuffer = [];
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
 * Show a warning toast: the operation went through, but something alongside it
 * failed (e.g. an action that runs after a committed write).
 */
export function showWarning(title: string, detail: string) {
  if (notifyCtrlState.notifyCallback != null) {
    notifyCtrlState.notifyCallback(ToastMode.WARNING, title, detail);
  }
}

/**
 * Show an info toast: a neutral notice, e.g. about something that was done for
 * the user, with an optional link to undo it.
 * @param title the title to display.
 * @param detail the message below, giving more detail.
 * @param link optional action link below the detail (e.g. "Restore filters").
 */
export function showInfo(title: string, detail: string, link?: ToastLink) {
  if (notifyCtrlState.notifyCallback != null) {
    notifyCtrlState.notifyCallback(ToastMode.INFO, title, detail, link);
  }
}

/**
 * Show success toast.
 * @param title the title to display.
 * @param detail the message below, giving more detail.
 * @param link optional action link below the detail (e.g. "Show changes").
 */
export function showSuccess(title: string, detail: string, link?: ToastLink) {
  if (notifyCtrlState.notifyCallback != null) {
    notifyCtrlState.notifyCallback(ToastMode.SUCCESS, title, detail, link);
  }
}
