import { lazy, Suspense, LazyExoticComponent, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import DefaultLayout from './view/thirdparty-based-components/Layout';
import Loader from './view/thirdparty-based-components/Loader';
import PageTitle from './view/thirdparty-based-components/PageTitle/PageTitle';
import LoginView from './view/pages/Login/LoginView';

import { AppConfig, getConfig, YACBackend } from './model/ConfigFetcher';
import { getBackends } from './controller/global/YACBackends';
import { registerNavigationHook } from './controller/global/URLValidation';
import { showError } from './controller/local/ErrorNotifyController';
import { ToastContextProvider } from './view/components/ToastNotification/ToastContext';
import { ModalContextProvider } from './view/components/Modal/ModalContext';

// LAZY PAGES
// let Overview = lazy(() => import('./view/pages/Overview/Overview'));
// let EditView = lazy(() => import('./view/pages/Edit/EditView'));
// let RedirectView: any;
// const [Overview, RedirectView, EditView] = multiLazy([
//   () => import('./view/pages/Overview/Overview'),
//   () => import('./view/pages/Login/RedirectView'),
//   () => import('./view/pages/Edit/EditView'),
// ]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EditView: React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Overview: LazyExoticComponent<React.FC<any>> | React.FC<any> = lazy(() =>
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
//const DevInfo = lazy(() => import('./view/pages/DevInfo/DevInfo'));
import DevInfo from './view/pages/DevInfo';
import { generateCSP } from './session/csp';

/**
 * The main application component that sets up the routing and context providers.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @remarks
 * This component initializes the application by fetching the backend configurations and setting up the routes.
 *
 * @context
 * - `ToastContextProvider`: Provides toast notifications throughout the application.
 * - `ModalContextProvider`: Manages modal dialogs within the application.
 *
 */
function App(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<AppConfig>({} as AppConfig);
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
      const conf = await getConfig();

      if (conf == null) {
        showError('Config Not Available', 'Cannot fetch the config. Please contact the admin.');
        return;
      }
      generateCSP(conf);
      const backends: YACBackend[] = await getBackends();
      setBackendsList(backends);
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
        {/* While getting config and generating csp, do not proceed
      to load other data. */}
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
