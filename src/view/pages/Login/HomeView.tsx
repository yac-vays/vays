import { useEffect, useState } from 'react';
import { userIsLoggedIn } from '../../../session/login/tokenHandling';
import { AppConfig } from '../../../utils/types/config';
import LandingView from './LandingView';
import LoginView from './LoginView';

interface HomeViewProps {
  config: AppConfig;
}

/**
 * The home route ("/"). Shows the welcome landing page when logged in and the
 * login box otherwise, switching reactively on the sign-in / sign-out events.
 */
const HomeView: React.FC<HomeViewProps> = ({ config }) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!userIsLoggedIn());

  useEffect(() => {
    const onSignIn = () => setLoggedIn(true);
    const onSignOut = () => setLoggedIn(false);
    window.addEventListener('sign-in', onSignIn);
    window.addEventListener('sign-out', onSignOut);
    return () => {
      window.removeEventListener('sign-in', onSignIn);
      window.removeEventListener('sign-out', onSignOut);
    };
  }, []);

  return loggedIn ? <LandingView config={config} /> : <LoginView config={config} />;
};

export default HomeView;
