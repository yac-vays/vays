import { createContext, useContext, useRef } from 'react';
import ConfirmAlert, { CallbackSuccessType } from '.';
import { ActionDecl } from '../../../utils/types/api';

/**
 * Mode is either
 */
export type ModalCallback = (
  title: string,
  detail: string,
  callbackSuccess: CallbackSuccessType,
  callbackCancel: () => Promise<void>,
  confirmVerb: string,
  enableTextInput: boolean,
  actions?: ActionDecl[],
) => void;

// create context
// type should be { showModal:ModalCallback|undefined } vut this is very ugly, as it is always assuming that it can be undefined.
const ModalContext: React.Context<any> = createContext<any>({ showModal: undefined });

// wrap context provider to add functionality
export const ModalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const modalRef = useRef<ConfirmAlert>(null);

  const showModal: ModalCallback = (
    title,
    detail,
    callbackSuccess,
    callbackCancel,
    confirmVerb,
    enableTextInput,
    actions,
  ) => {
    if (!modalRef.current) return;
    modalRef.current.show(
      title,
      detail,
      callbackSuccess,
      callbackCancel,
      confirmVerb,
      enableTextInput, // TODO: Allow setting this so you can do ... And put input into success.
      actions,
    );
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      <ConfirmAlert ref={modalRef} />
      <div>{children}</div>
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModalContext has to be used within ModalContextProvider');
  }

  return context;
};
