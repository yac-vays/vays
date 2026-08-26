const ErrorBox = ({ displayError }: { displayError: string }) => {
  if (!displayError) return null;
  return (
    <div className="p-1">
      <span className="text-[#d32f2f] capitalize">Error: {displayError}</span>
    </div>
  );
};

export default ErrorBox;
