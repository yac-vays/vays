import { useEffect } from 'react';
import { getDefaultURL, navigateToURL } from '../../../controller/global/URLValidation';
import { getBackends } from '../../../controller/global/YACBackends';
import Loader from '../../thirdparty-based-components/Loader';
import { getToken } from '../../../session/login/loginProcess';
import { AppConfig } from '../../../model/ConfigFetcher';
import iSessionStorage from '../../../session/storage/SessionStorage';

const RedirectView = ({ appconf }: { appconf: AppConfig }) => {
  useEffect(() => {
    (async () => {
      if (!iSessionStorage.isLoggedIn() && !(await getToken(appconf))) {
        navigateToURL('/error-page');
        iSessionStorage.setIsLoggedIn(false);
        return;
      }
      iSessionStorage.setIsLoggedIn(true);

      const mostRecentURL = iSessionStorage.getMostRecentURL(true);
      if (mostRecentURL && mostRecentURL !== '/') {
        navigateToURL(mostRecentURL); // navigateToURL
      } else {
        navigateToURL(await getDefaultURL(await getBackends()));
      }
    })();
  }, []);
  /************
   *   useLayoutEffect(() => {
    getToken(appconf).then((authSuccessful) => {
      if (!iSessionStorage.isLoggedIn() && !authSuccessful) {
        navigateToURL('/error-page');
        iSessionStorage.setIsLoggedIn(false);
        return;
      }
      iSessionStorage.setIsLoggedIn(true);

      const mostRecentURL = iSessionStorage.getMostRecentURL();
      if (mostRecentURL) {
        navigateToURL(mostRecentURL);
      } else {
        getDefaultURL(getBackends()).then((url) => navigateToURL(url));
      }
    });
  }, []);
   */

  return <Loader />;
};

export default RedirectView;
