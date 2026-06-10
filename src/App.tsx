import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import HomeView from './view/pages/Login/HomeView';
import DefaultLayout from './view/thirdparty/components/Layout';
import Loader from './view/thirdparty/components/Loader';
import PageTitle from './view/thirdparty/components/PageTitle/PageTitle';

import { registerNavigationHook } from './controller/global/url';
import { getConfig } from './model/config';
import { setColors } from './session/color';
import { generateCSP } from './session/csp';
import { setFavicon } from './session/favicon';
import { AppConfig, YACBackend } from './utils/types/config';
import { ModalContextProvider } from './view/components/Modal/ModalContext';
import { ToastContextProvider } from './view/components/ToastNotification/ToastContext';
import DevInfo from './view/pages/DevInfo';

const Overview = lazy(() =>
  import('./view/pages/Bundles/LogRouteBundle').then((module) => ({
    default: module.Overview,
  })),
);
const EditView = lazy(() =>
  import('./view/pages/Bundles/LogRouteBundle').then((module) => ({
    default: module.EditView,
  })),
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

  useEffect(() => {
    registerNavigationHook(navigate);
  }, [navigate]);

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
      setFavicon(conf);
      setLoading(false);
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
              {/* The browser tab title is always the title configured in config.json. */}
              <PageTitle title={config.title} />
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <HomeView config={config} />
                    </>
                  }
                />
                <Route
                  path="/oauth2-redirect"
                  element={
                    <>
                      <RedirectView appconf={config} />
                    </>
                  }
                />
                <Route
                  path="/error-page"
                  element={
                    <>
                      <Suspense fallback={<Loader bgTransparent />}>
                        <ErrorPage />
                      </Suspense>
                    </>
                  }
                />
                <Route
                  // index
                  path="/:backendName/:entityTypeName/:entityName?"
                  element={
                    <>
                      <Overview backends={backendsList} />
                    </>
                  }
                />
                <Route
                  // index
                  path="/dev-info"
                  element={
                    <>
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
                      <EditView backends={backendsList} mode={'create'} />
                    </>
                  }
                />
                <Route
                  path="/:backendName/:entityTypeName/modify/:entityName?"
                  element={
                    <>
                      <EditView backends={backendsList} mode={'change'} />
                    </>
                  }
                />
                <Route
                  path="/:backendName/:entityTypeName/view/:entityName?"
                  element={
                    <>
                      <EditView backends={backendsList} mode={'read'} />
                    </>
                  }
                />
              </Routes>
            </DefaultLayout>
          </ModalContextProvider>
        )}
      </Suspense>
    </ToastContextProvider>
  );
}

export default App;
