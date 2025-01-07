const DeleteButton = ({ removeCallback }: { removeCallback: () => void }) => {
  return (
    <div className="flex w-8 items-center py-1 pl-1 pr-1">
      <button
        type="button"
        onClick={removeCallback}
        className="h-6 w-6 cursor-pointer outline-none focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="none"
        >
          <path
            d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            fill="#637381"
          />
        </svg>
      </button>
    </div>
  );
};

export default DeleteButton;
