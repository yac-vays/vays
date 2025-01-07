import 'react-toastify/dist/ReactToastify.css';

import { createContext, useContext } from 'react';
import SuccessNotification from './SuccessNotification';
import { Id, toast, ToastContainer } from 'react-toastify';
import ErrorNotification from './ErrorNotification';
import { hashCode } from '../../../utils/hashUtils';

export const enum ToastMode {
  SUCCESS,
  ERROR,
}

/**
 * Mode is either
 */
export type ToastCallback = (mode: ToastMode, title: string, detail: string) => void;

// create context
const ToastContext: React.Context<any> = createContext<any>(undefined);

// wrap context provider to add functionality
export const ToastContextProvider = ({ children }: { children: React.ReactNode }) => {
  const showToast: ToastCallback = (mode: ToastMode, title: string, detail: string): void => {
    switch (mode) {
      case ToastMode.SUCCESS: {
        toast(<SuccessNotification {...{ title, detail }} />, {
          icon: false,
          className:
            'sm:w-full max-w-[490px] bg-white border-solid border-[1px] rounded py-2 pl-2 pr-3 shadow-2 dark:bg-meta-4',
          toastId: hashCode(title + detail),
        });
        break;
      }
      case ToastMode.ERROR: {
        toast.error(<ErrorNotification {...{ title, detail }} />, {
          icon: false,
          className:
            'sm:w-full max-w-[490px] bg-white border-solid border-[1px] rounded py-2 pl-2 pr-3 shadow-2 dark:bg-meta-4',
          toastId: hashCode(title),
        });
      }
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastContainer pauseOnHover stacked autoClose={8000} position="bottom-right" />
      <div>{children}</div>
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToastContext have to be used within ToastContextProvider');
  }

  return context;
};
