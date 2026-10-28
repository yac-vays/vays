/**
 * Full-screen spinner. `neutral` draws it grey instead of in the primary
 * colour - for the very first loader, shown while config.json (and with it the
 * configured colour scheme) is still being fetched.
 */
const Loader = ({ bgTransparent, neutral }: { bgTransparent?: boolean; neutral?: boolean }) => {
  return (
    <div
      className={`flex h-screen items-center justify-center ${
        bgTransparent ? 'bg-transparent' : 'bg-white'
      }`}
    >
      <div
        className={`h-16 w-16 animate-spin rounded-full border-4 border-solid ${
          neutral ? 'border-gray-400' : 'border-primary'
        } border-t-transparent`}
      ></div>
    </div>
  );
};

export default Loader;
