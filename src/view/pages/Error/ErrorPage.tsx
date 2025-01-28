const ErrorPage = () => {
  return (
    <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
      <div
        className="max-w-screen-xl px-4 flex items-center justify-start align-middle md:px-8"
        style={{
          height: 'calc(100vh - 170px)',
        }}
      >
        <div className="max-w-lg mx-auto justify-center space-y-3 text-center">
          <h3 className="font-lg text-plainfont font-bold">404 Error</h3>
          <div className="pb-4 text-5xl font-black text-plainfont">Page not found</div>
          <p className="font-medium">
            Sorry, the page you are looking for could not be found or has been removed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              onClick={() => history.back()}
              className="block cursor-pointer py-2 px-4 text-white font-medium bg-primary duration-150 hover:opacity-70 rounded-lg"
            >
              Go back
            </a>
            <a
              href="mailto:TODO@ethz.ch?subject=Error Report"
              className="block py-2 px-4 hover:opacity-70 font-medium duration-150 active:bg-gray-100 border rounded-lg"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
