import React, { useState, ReactNode } from 'react';
import Header from '../Header/index';
import Sidebar from '../Sidebar/index';
import { YACBackend } from '../../../model/ConfigFetcher';
import { useToastContext } from '../../components/ToastNotification/ToastContext';
import { registerErrorNotifyCallback } from '../../../controller/local/ErrorNotifyController';
import { useModalContext } from '../../components/Modal/ModalContext';
import { registerModalCallback } from '../../../controller/global/ModalController';
import Tour from '../../components/Tour';

const DefaultLayout: React.FC<{ children: ReactNode; backendList: YACBackend[] }> = ({
  children,
  backendList,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
