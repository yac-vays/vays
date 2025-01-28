const ErrorNotification = ({ title, detail }: { title: string; detail: string }) => {
  return (
    <>
      <div className="flex flex-grow items-center gap-5">
        <div className="flex h-10 w-full max-w-10 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48px"
            viewBox="0 -960 960 960"
            width="48px"
            fill="#dc3545"
          >
            <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
          </svg>
        </div>
        <div>
          {/* Need to be more explicit with the text color to overwrite the default style of toastify. */}
          <h4 className="mb-0.5 text-title-xsm font-medium text-plainfont">{title}</h4>
          <p className="text-sm font-medium text-reducedfont">{detail}</p>
        </div>
      </div>
    </>
  );
};

export default ErrorNotification;
