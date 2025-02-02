import { ActionDecl } from '../../utils/types/api';
import { CallbackSuccessType } from '../../view/components/Modal';
import { ModalCallback } from '../../view/components/Modal/ModalContext';
import modalCtrlState from '../state/ModalCtrlState';

export function registerModalCallback(callback: ModalCallback) {
  modalCtrlState.modalCallback = callback;
}

export function showModalMessage(
  title: string,
  text: string,
  callbackSuccess: CallbackSuccessType,
  callbackCancel: () => Promise<void>,
  confirmVerb: string,
  enableTextInput: boolean = false,
  actions?: ActionDecl[],
) {
  if (modalCtrlState.modalCallback != null) {
    modalCtrlState.modalCallback(
      title,
      text,
      callbackSuccess,
      callbackCancel,
      confirmVerb,
      enableTextInput,
      actions,
    );
  }
}
