import { getUserName } from '../../../session/login/tokenHandling';
import { AppConfig } from '../../../utils/types/config';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';

interface LandingViewProps {
  config: AppConfig;
}

/**
 * The logged-in home page: a regular page with the portal title in the top bar
 * and a plain white content box welcoming the user. No logout button — logging
 * out is done from the user menu in the top bar.
 */
const LandingView: React.FC<LandingViewProps> = ({ config }) => {
  return (
    <>
      <PageHeaderTitle title={config.title} subText="" />
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:bg-boxdark">
        <h3 className="mb-2.5 text-2xl font-black text-plainfont">Welcome, {getUserName()}!</h3>
        <p className="font-medium">
          You are signed in to {config.title}. Choose a configuration from the menu on the left to
          view and manage its entries.
        </p>
      </div>
    </>
  );
};

export default LandingView;
