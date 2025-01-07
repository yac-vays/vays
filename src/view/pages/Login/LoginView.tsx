import eth_logo from '../../../../rsc/logo/eth_logo_black.svg';
import eth_logo_dark from '../../../../rsc/logo/eth_logo.svg';
import { useEffect, useState } from 'react';
import { navigateToURL } from '../../../controller/global/URLValidation';
import { getUserName, logOut, performDiscovery } from '../../../session/login/loginProcess';
import { AppConfig } from '../../../model/ConfigFetcher';
import iSessionStorage from '../../../session/storage/SessionStorage';

interface LoginViewProps {
  config: AppConfig;
}

const LoginView: React.FC<LoginViewProps> = ({ config }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener('theme-switch', () => {
      /**
       * TODO: Do better handling of the dark mode.
       */
      setIsDarkMode(window.document.body.classList.contains('dark'));
    });
  }, [window.document.body.classList]);
  return (
    <>
      <div className="w-full h-full items-center justify-center text-center">
        <div className="mx-auto w-full max-w-[580px] items-center justify-center content-center text-center align-middle">
          <div className="flex justify-center mb-4">
            {!isDarkMode ? (
              <img src={eth_logo} width={300} alt="Logo" />
            ) : (
              <img src={eth_logo_dark} width={300} alt="Logo" />
            )}
          </div>
          <div className="rounded-xl p-4 lg:p-8 xl:p-14 shadow-lg bg-white dark:bg-boxdark">
            <div className="mb-2.5 text-3xl font-black leading-loose text-black dark:text-white">
              {config.title}
            </div>
            <p className="mb-12 font-medium">
              {iSessionStorage.isLoggedIn()
                ? `You are logged in as ${getUserName()}. When you log out, make sure you close the browser to clear all data.`
                : 'Please sign in to access the self-service portal. If you think it is a mistake that you see this, please contact the IT Services.'}
            </p>

            <button
              className={`flex w-full justify-center rounded-md ${
                iSessionStorage.isLoggedIn() ? 'bg-[grey]' : 'bg-primary'
              } p-4 font-bold text-gray hover:bg-opacity-60`}
              onClick={async () => {
                if (iSessionStorage.isLoggedIn()) {
                  logOut();
                  // TODO: Invalidate the whole cache!
                  navigateToURL('/');
                } else {
                  const resp = await performDiscovery(config);
                  if (resp == null) {
                    navigateToURL('/error-page');
                    return;
                  }
                  window.location.replace(resp.href);
                }
              }}
            >
              {iSessionStorage.isLoggedIn() ? 'Log Out' : 'Log In'} {'>'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginView;
