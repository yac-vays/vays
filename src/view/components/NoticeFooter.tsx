import VAYS_VERSION from '../../../rsc/version';

/** Sidebar footer: the running frontend version (help lives in the top bar). */
const NoticeFooter = () => {
  return <div className="text-sm p-2 text-white overflow-hidden pb-3">VAYS {VAYS_VERSION}</div>;
};

export default NoticeFooter;
