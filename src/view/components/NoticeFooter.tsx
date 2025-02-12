import { NavLink } from 'react-router-dom';
import VAYS_VERSION from '../../../rsc/version';

const NoticeFooter = () => {
  return (
    <div className="text-sm p-2 text-white overflow-hidden pb-3">
      VAYS {VAYS_VERSION}
      <br />
      <div className="flex flex-row hover:translate-x-[10px] duration-500">
        2024 ETH Zürich -{' '}
        <NavLink to="/dev-info" className="pl-1 flex flex-row">
          Dev. Information
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="#e8eaed"
            className="pt-1.5"
          >
            <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z" />
          </svg>
        </NavLink>
      </div>
    </div>
  );
};

export default NoticeFooter;
