import { getUserName } from '../../../session/login/tokenHandling';
import { AppConfig } from '../../../utils/types/config';
import MarkdownRender from '../../components/Markdown';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';

interface LandingViewProps {
  config: AppConfig;
}

/**
 * The logged-in home page: a regular page with the portal title in the top bar
 * and a plain white content box welcoming the user. The body is the
 * deployment-specific `welcomeText` from the app config (markdown), with a
 * plain sign-in note as the default. No logout button — logging out is done
 * from the user menu in the top bar.
 */
const LandingView: React.FC<LandingViewProps> = ({ config }) => {
  return (
    <>
      <PageHeaderTitle title={config.title} subText="" />
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:bg-boxdark">
        <h3 className="mb-2.5 text-2xl font-black text-plainfont">Welcome, {getUserName()}!</h3>
        <div className="font-medium">
          <MarkdownRender text={config.welcomeText ?? `You are signed in to ${config.title}.`} />
        </div>
      </div>
    </>
  );
};

export default LandingView;
