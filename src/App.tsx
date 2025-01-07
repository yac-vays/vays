import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Loader from './view/thirdparty-based-components/Loader';
import DefaultLayout from './view/thirdparty-based-components/Layout';
import PageTitle from './view/thirdparty-based-components/PageTitle/PageTitle';
import LoginView from './view/pages/Login/LoginView';

import { getConfig, YACBackend } from './model/ConfigFetcher';
import { getBackends } from './controller/global/YACBackends';
import { registerNavigationHook } from './controller/global/URLValidation';
import { ToastContextProvider } from './view/components/ToastNotification/ToastContext';
import { ModalContextProvider } from './view/components/Modal/ModalContext';
import { showError } from './controller/local/ErrorNotifyController';

// LAZY PAGES
// let Overview = lazy(() => import('./view/pages/Overview/Overview'));
// let EditView = lazy(() => import('./view/pages/Edit/EditView'));
// let RedirectView: any;
// const [Overview, RedirectView, EditView] = multiLazy([
//   () => import('./view/pages/Overview/Overview'),
//   () => import('./view/pages/Login/RedirectView'),
//   () => import('./view/pages/Edit/EditView'),
// ]);

let EditView: any;
let Overview: any = lazy(() =>
  import('./view/pages/Bundles/LogRouteBundle').then((module) => {
    EditView = module.EditView;
    return { default: module.Overview };
  }),
);
EditView = lazy(() =>
  import('./view/pages/Bundles/LogRouteBundle').then((module) => {
    Overview = module.Overview;
    return { default: module.EditView };
  }),
);
const RedirectView = lazy(() =>
  import('./view/pages/Bundles/LogRouteBundle').then((module) => ({
    default: module.RedirectView,
  })),
);

const ErrorPage = lazy(() => import('./view/pages/Error/ErrorPage'));
// const RedirectView = lazy(() => import('./view/pages/Login/RedirectView'));
const DevInfo = lazy(() => import('./view/pages/DevInfo'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<any>(null);
  const [backendsList, setBackendsList] = useState<YACBackend[]>([
    {
      name: 'Loading...',
      title: 'Loading...',
      icon: '',
      url: '',
    },
  ]);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  registerNavigationHook(navigate);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      const backends: YACBackend[] = await getBackends();
      console.error(backends);
      setBackendsList(backends);
      const conf = await getConfig();
      console.error(conf);
      if (conf == null) {
        showError('Config Not Available', 'Cannot fetch the config. Please contact the admin.');
        return;
      }
      setConfig(conf);
      setLoading(false);
      // setTimeout(() => {
      //   driverObj.drive();
      // }, 2000);
      // window.onload = () => driverObj.drive();
    })();
  }, []);

  return (
    <ToastContextProvider>
      <Suspense fallback={<Loader />}>
        {loading ? (
          <Loader />
        ) : (
          <ModalContextProvider>
            <DefaultLayout backendList={backendsList}>
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <PageTitle title="Landing Page" />
                      <LoginView config={config} />
                    </>
                  }
                />
                <Route
                  path="/oauth2-redirect"
                  element={
                    <>
                      <PageTitle title="Finishing Authentication" />
                      <RedirectView appconf={config} />
                    </>
                  }
                />
                <Route
                  path="/error-page"
                  element={
                    <>
                      <PageTitle title="Error" />
                      <Suspense fallback={<Loader bgTransparent />}>
                        <ErrorPage />
                      </Suspense>
                    </>
                  }
                />
                <Route
                  // index
                  path="/:backendName/:entityTypeName/"
                  element={
                    <>
                      <PageTitle title="List entities" />
                      <Overview backends={backendsList} />
                    </>
                  }
                />
                <Route
                  // index
                  path="/dev-info"
                  element={
                    <>
                      <PageTitle title="Developer Information" />
                      <Suspense fallback={<Loader bgTransparent />}>
                        <DevInfo />
                      </Suspense>
                    </>
                  }
                />
                <Route
                  path="/:backendName/:entityTypeName/create/:entityName?"
                  element={
                    <>
                      <PageTitle title="Create Entity" />
                      <EditView backends={backendsList} mode={'create'} />
                    </>
                  }
                />
                <Route
                  path="/:backendName/:entityTypeName/modify/:entityName?"
                  element={
                    <>
                      <PageTitle title="Edit Entity" />
                      <EditView backends={backendsList} mode={'modify'} />
                    </>
                  }
                />
                {/* <Route path="*" element={<Navigate to="/error/not-found" replace />} /> */}
              </Routes>
            </DefaultLayout>
            {/* <Tour /> */}
          </ModalContextProvider>
        )}
      </Suspense>
    </ToastContextProvider>
  );
}

export default App;
