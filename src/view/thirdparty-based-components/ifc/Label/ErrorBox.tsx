const ErrorBox = ({ displayError }: { displayError: string }) => {
  return (
    <div className="p-1">
      <span className="text-[#d32f2f] capitalize">
        {displayError ? 'Error: ' : <></>}
        {displayError}
      </span>
    </div>
  );
};

export default ErrorBox;
