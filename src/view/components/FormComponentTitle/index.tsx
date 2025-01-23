import ErrorButton from '../Buttons/ErrorButton';

const FormComponentTitle = ({
  label,
  large,
  onClick,
  description,
  hideAddButton,
  required,
  errors,
}: {
  label?: string;
  large?: boolean;
  onClick: () => void;
  description?: string;
  hideAddButton?: boolean;
  required?: boolean;
  errors?: string;
}) => {
  return (
    <>
      <div className="relative flex flex-row w-full">
        <h4 className={`mb-0 ${large ? 'text-2xl' : 'text-xl'} text-black dark:text-white`}>
          {label} {required ? <span className="text-meta-1 pr-2"> *</span> : <></>}
        </h4>

        {/* TODO: Do error reporting... */}
        {/* <ErrorBox displayError={this.props.errors} /> */}
        {hideAddButton ? (
          <></>
        ) : (
          <div className="text-[#98A6AD] hover:text-body">
            <button className="absolute" style={{ right: 0 }} onClick={onClick}>
              <svg
                className="fill-current mr-3"
                xmlns="http://www.w3.org/2000/svg"
                height="32px"
                viewBox="0 -960 960 960"
                width="32px"
                fill="#e8eaed"
              >
                <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="inline flex flex-row">
        {description ?? (
          <em className="opacity-50 text-black dark:text-white">No description provided.</em>
        )}
        {errors ? (
          <label className="inline ml-2.5 block text-black dark:text-white flex flex-row">
            <div className="relative">
              <ErrorButton content={errors} />
            </div>
          </label>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default FormComponentTitle;
