import { useEffect } from 'react';
import { getDefaultURL, navigateToURL } from '../../../controller/global/url';
import Loader from '../../thirdparty-based-components/Loader';
import { getToken } from '../../../session/login/loginProcess';
import { AppConfig } from '../../../utils/types/config';
import iSessionStorage from '../../../session/storage/SessionStorage';
import { getConfig } from '../../../model/config';

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
        navigateToURL(await getDefaultURL((await getConfig())?.backends ?? []));
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
        getDefaultURL(getConfig().backends ?? []).then((url) => navigateToURL(url));
      }
    });
  }, []);
   */

  return <Loader />;
};

export default RedirectView;
