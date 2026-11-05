import { NavLink } from 'react-router';

/** Top-bar button linking to the configuration reference / docs page (`/docs`). */
const DocsButton = () => {
  return (
    <li>
      <NavLink
        to="/docs"
        title="Configuration Reference"
        aria-label="Configuration Reference"
        className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-stroke bg-primary-5 duration-300 hover:scale-110 hover:text-primary dark:bg-meta-4 dark:text-white"
      >
        {/* Material Symbols "menu_book" / document reference icon */}
        <svg
          className="fill-current"
          xmlns="http://www.w3.org/2000/svg"
          height="22px"
          viewBox="0 -960 960 960"
          width="22px"
        >
          <path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-800v200-200 640-640Z" />
        </svg>
      </NavLink>
    </li>
  );
};

export default DocsButton;
