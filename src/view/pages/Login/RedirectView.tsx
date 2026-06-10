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

  return <Loader />;
};

export default RedirectView;
