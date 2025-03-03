import { lazy, LazyExoticComponent, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import LoginView from './view/pages/Login/LoginView';
import DefaultLayout from './view/thirdparty/components/Layout';
import Loader from './view/thirdparty/components/Loader';
import PageTitle from './view/thirdparty/components/PageTitle/PageTitle';

import { registerNavigationHook } from './controller/global/url';
import { getConfig } from './model/config';
import { setColors } from './session/color';
import { generateCSP } from './session/csp';
import { AppConfig, YACBackend } from './utils/types/config';
import { ModalContextProvider } from './view/components/Modal/ModalContext';
import { ToastContextProvider } from './view/components/ToastNotification/ToastContext';
import DevInfo from './view/pages/DevInfo';

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
        return;
      }
      generateCSP(conf);
      setBackendsList(conf.backends ?? []);
      setConfig(conf);
      setColors(conf);
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
                      <EditView backends={backendsList} mode={'change'} />
                    </>
                  }
                />
                <Route
                  path="/:backendName/:entityTypeName/view/:entityName?"
                  element={
                    <>
                      <PageTitle title="View Entity" />
                      <EditView backends={backendsList} mode={'read'} />
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
