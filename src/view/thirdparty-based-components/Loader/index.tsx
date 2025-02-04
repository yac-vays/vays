import { registerModalCallback } from '../../../controller/global/modal';
import { registerErrorNotifyCallback } from '../../../controller/local/notification';
import { useModalContext } from '../../components/Modal/ModalContext';
import { useToastContext } from '../../components/ToastNotification/ToastContext';

const Loader = ({ bgTransparent }: { bgTransparent?: boolean }) => {
  const { showToast }: any = useToastContext();
  registerErrorNotifyCallback(showToast);
  const { showModal } = useModalContext();
  registerModalCallback(showModal);
  return (
    <div
      className={`flex h-screen items-center justify-center ${
        bgTransparent ? 'bg-transparent' : 'bg-white'
      }`}
    >
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
};

export default Loader;
