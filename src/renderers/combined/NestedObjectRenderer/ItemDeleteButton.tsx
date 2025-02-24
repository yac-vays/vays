const ItemDeleteButton = ({
  callback,
  enabled,
}: {
  callback: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  enabled: boolean;
}) => {
  return (
    <div className="w-[60px] flex items-center justify-center">
      <div>
        <button
          disabled={!enabled}
          onClick={callback}
          className={`text-[#98A6AD] hover:text-plainfont grow items-center justify-center ${
            enabled ? '' : 'opacity-40'
          } `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48px"
            className="fill-current"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
          >
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ItemDeleteButton;
