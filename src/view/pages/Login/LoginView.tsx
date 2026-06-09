import { startAuthentication } from '../../../session/login/loginProcess';
import { AppConfig } from '../../../utils/types/config';

interface LoginViewProps {
  config: AppConfig;
}

/**
 * The logged-out home page: a centered info box with the portal title and a
 * single Log In button. (When logged in, the home route renders LandingView
 * instead.)
 */
const LoginView: React.FC<LoginViewProps> = ({ config }) => {
  return (
    <div className="w-full h-full items-center justify-center text-center">
      <div className="mx-auto w-full max-w-[580px] items-center justify-center content-center text-center align-middle">
        <div className="rounded-xl p-4 lg:p-8 xl:p-14 shadow-lg bg-white dark:bg-boxdark">
          <div className="mb-2.5 text-3xl font-black leading-loose text-plainfont">
            {config.title}
          </div>
          <p className="mb-12 font-medium">
            Please sign in to access the self-service portal. If you think it is a mistake that you
            see this, please contact the IT Services.
          </p>

          <button
            className="flex w-full justify-center rounded-md bg-primary p-4 font-bold text-plainfont-inv hover:bg-opacity-60"
            onClick={async () => {
              await startAuthentication(config);
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
