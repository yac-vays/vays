import { createContext, useContext, useRef } from 'react';
import ConfirmAlert from '.';
import { ActionDecl } from '../../../utils/types/api';
import { CallbackSuccessType } from '../../../utils/types/internal/modal';
import { ConcurrencyReportProps } from '../ConcurrencyReport';

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
  crep?: ConcurrencyReportProps,
) => void;

// create context
// type should be { showModal:ModalCallback|undefined } vut this is very ugly, as it is always assuming that it can be undefined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    crep,
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
      crep,
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
