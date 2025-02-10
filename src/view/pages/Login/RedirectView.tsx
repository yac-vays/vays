import { useEffect } from 'react';
import { getDefaultURL, navigateToURL } from '../../../controller/global/url';
import { getConfig } from '../../../model/config';
import { finalizeAuthentication } from '../../../session/login/loginProcess';
import { setUserLoggedIn, userIsLoggedIn } from '../../../session/login/tokenHandling';
import iSessionStorage from '../../../session/storage/SessionStorage';
import { AppConfig } from '../../../utils/types/config';
import Loader from '../../thirdparty/components/Loader';

const RedirectView = ({ appconf }: { appconf: AppConfig }) => {
  useEffect(() => {
    (async () => {
      if (!userIsLoggedIn() && !(await finalizeAuthentication(appconf))) {
        navigateToURL('/error-page');
        setUserLoggedIn(false);
        return;
      }

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
    finalizeAuthentication(appconf).then((authSuccessful) => {
      if (!iSessionStorage.isLoggedIn() && !authSuccessful) {
        navigateToURL('/error-page');
        setUserLoggedIn(false);
        return;
      }
      setUserLoggedIn(true);

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
