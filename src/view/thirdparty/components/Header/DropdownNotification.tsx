import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearWarningMessageBuffer,
  getWarningMessageBuffer,
} from '../../../../controller/global/troubleshoot';
import troubleshootCtrlState from '../../../../controller/state/TroubleShootState';
import SchemaWarningMessage, {
  TroubleShootMessageProps,
} from '../../../components/SchemaWarningMessage';
import ClickOutside from '../../ClickOutside';

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [content, setContent] = useState<{ prop: TroubleShootMessageProps; msgKey: string }[]>([]);
  troubleshootCtrlState.update = (showNotify: boolean = true) => {
    setContent(getWarningMessageBuffer());
    setNotifying(showNotify);
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <li className="lg:hover:scale-110 duration-500">
        <Link
          onClick={() => {
            setNotifying(false);
            setDropdownOpen(!dropdownOpen);
          }}
          to="#"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-stroke bg-primary-5 hover:text-primary dark:bg-meta-4 dark:text-white sm:hover:scale-125 lg:hover:scale-100 duration-500"
        >
          <span
            className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-danger ${
              notifying === false ? 'hidden' : 'inline'
            }`}
          >
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
          </span>

          <svg
            className="fill-current duration-300 ease-in-out"
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="none"
          >
            <path d="M824-120 636-308q-41 32-90.5 50T440-240q-90 0-162.5-44T163-400h98q34 37 79.5 58.5T440-320q100 0 170-70t70-170q0-100-70-170t-170-70q-94 0-162.5 63.5T201-580h-80q8-127 99.5-213.5T440-880q134 0 227 93t93 227q0 56-18 105.5T692-364l188 188-56 56ZM397-400l-63-208-52 148H80v-60h160l66-190h60l61 204 43-134h60l60 120h30v60h-67l-47-94-50 154h-59Z" />
          </svg>

          {/* <svg
            className="fill-current duration-300 ease-in-out"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C8.29678 1.65928 8.24053 1.65928 8.18428 1.6874C4.92178 2.05303 2.4749 4.66865 2.4749 7.79053V13.528C2.44678 13.8093 2.39053 13.9499 2.33428 14.0343L1.7999 14.9343C1.63115 15.2155 1.63115 15.553 1.7999 15.8343C1.96865 16.0874 2.2499 16.2562 2.55928 16.2562H8.38115V16.8749C8.38115 17.2124 8.6624 17.5218 9.02803 17.5218C9.36553 17.5218 9.6749 17.2405 9.6749 16.8749V16.2562H15.4687C15.778 16.2562 16.0593 16.0874 16.228 15.8343C16.3968 15.553 16.3968 15.2155 16.1999 14.9343ZM3.23428 14.9905L3.43115 14.653C3.5999 14.3718 3.68428 14.0343 3.74053 13.6405V7.79053C3.74053 5.31553 5.70928 3.23428 8.3249 2.95303C9.92803 2.78428 11.503 3.2624 12.6562 4.2749C13.6687 5.1749 14.2312 6.38428 14.2312 7.67803V13.528C14.2312 13.9499 14.3437 14.3437 14.5968 14.7374L14.7655 14.9905H3.23428Z"
              fill=""
            />
          </svg> */}
        </Link>

        {dropdownOpen && (
          <div
            className={`absolute -right-27 mt-2.5 flex max-h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:bg-boxdark sm:right-0 sm:w-80 drop-shadow-md`}
          >
            <div className="px-4.5 py-3 flex flex-row">
              <h5 className="text-medium font-bold grow">Schema Warnings</h5>
              <button className="right-0 text-medium" onClick={() => clearWarningMessageBuffer()}>
                Clear
              </button>
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto">
              <li>
                {(function () {
                  const jsx = [];
                  for (const elt of content) {
                    jsx.push(
                      <SchemaWarningMessage
                        priority={elt.prop.priority}
                        title={elt.prop.title}
                        affectedKeys={elt.prop.affectedKeys}
                        subtitle={elt.prop.subtitle}
                      />,
                    );
                  }
                  return jsx;
                })()}
              </li>
              {/* <li>
                <TroubleShootMessage
                  priority={7}
                  title="Password in Plaintext"
                  affectedKeys={[['Password', 'This Password']]}
                />
              </li>
              <li>
                <TroubleShootMessage
                  priority={4}
                  title="Password in Plaintext"
                  affectedKeys={[['Password', 'This Password']]}
                />
              </li>
              <li>
                <TroubleShootMessage
                  priority={2}
                  title="Password in Plaintext"
                  affectedKeys={[['Password', 'This Password']]}
                />
              </li> */}
            </ul>
          </div>
        )}
      </li>
    </ClickOutside>
  );
};

export default DropdownNotification;
