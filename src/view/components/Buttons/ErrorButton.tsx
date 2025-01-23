import { useRef, useState } from 'react';
import InfoPanel from '../InfoPanel';
import useOutsideClick from '../../hooks/useOutsideClick';

interface ErrorProps {
  content?: string;
  description?: string;
}

/**
 * Error button, which is displayed in Form Component Titles, for displaying errors.
 *
 * @param title the title of the input field
 * @param description the description to display
 * @returns
 */
const ErrorButton = ({ content }: ErrorProps) => {
  if (!content) return <></>;
  const [show, setShow] = useState<boolean>(false);
  const popoutRef = useRef<HTMLDivElement>(null);
  useOutsideClick(popoutRef, () => setShow(false));
  return (
    <>
      <div ref={popoutRef} onMouseLeave={() => setShow(false)}>
        <InfoPanel show={show} title={'Reported Errors'} description={content}>
          <div
            onMouseEnter={() => setShow(true)}
            onClick={() => setShow(!show)}
            className="cursor-pointer hover:scale-125 duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="red"
            >
              <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
          </div>
        </InfoPanel>
      </div>
    </>
  );
};

export default ErrorButton;
