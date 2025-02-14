import React, { ReactNode, useState } from 'react';
import { registerModalCallback } from '../../../../controller/global/modal';
import { registerErrorNotifyCallback } from '../../../../controller/global/notification';
import { YACBackend } from '../../../../utils/types/config';
import { useModalContext } from '../../../components/Modal/ModalContext';
import { useToastContext } from '../../../components/ToastNotification/ToastContext';
import Header from '../../components/Header/index';
import Sidebar from '../Sidebar/index';

const DefaultLayout: React.FC<{ children: ReactNode; backendList: YACBackend[] }> = ({
  children,
  backendList,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { showToast }: any = useToastContext();
  registerErrorNotifyCallback(showToast);
  const { showModal } = useModalContext();
  registerModalCallback(showModal);

  return (
    <div className="dark:bg-boxdark-2 dark:text-reducedfont">
      {/* <ErrorNotification /> */}
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          backendList={backendList}
        />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
