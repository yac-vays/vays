import { useNavigate } from 'react-router-dom';
import { YACBackend } from '../../../model/ConfigFetcher';
import { buildCreateURL } from '../../../controller/global/URLValidation';

interface AddButtonProps {
  entityName: string;
  yacBackendObject: YACBackend;
}

/**
 * Add button, which is displayed on the sidebar.
 *
 * @param entityName DEPRECATED: rename
 * @param yacBackendObject the backend object
 * @returns
 */
const AddButton = ({ entityName, yacBackendObject }: AddButtonProps) => {
  const navigate = useNavigate();
  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          navigate(buildCreateURL(yacBackendObject, entityName));
        }}
        className="inline-flex items-center justify-center border border-primary text-center gap-2.5 font-medium text-primary rounded hover:bg-greydark dark:hover:bg-meta-4 
          bg-graydark dark:bg-meta-4 cursor-pointer"
        style={{ right: 0, position: 'absolute' }}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#dee4ee"
          >
            <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"></path>
          </svg>
        </span>
      </div>
    </>
  );
};

export default AddButton;
