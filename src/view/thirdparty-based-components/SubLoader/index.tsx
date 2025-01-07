const SubLoader = ({ action }: { action: string }) => {
  return (
    <div id="Loader" className="relative flex h-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        <p className="pt-5">{action}</p>
      </div>
    </div>
  );
};

export default SubLoader;
