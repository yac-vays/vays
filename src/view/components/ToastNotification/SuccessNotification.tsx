import { ToastLink } from './ToastContext';

/**
 * A success toast, or with `info` a neutral notice (info symbol instead of the
 * green check).
 */
const SuccessNotification = ({
  title,
  detail,
  link,
  info = false,
}: {
  title: string;
  detail: string;
  link?: ToastLink;
  info?: boolean;
}) => {
  return (
    <>
      <div className="flex grow items-center gap-5">
        <div className="flex h-10 w-full max-w-10 items-center justify-center">
          {info ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#64748b"
              role="img"
              aria-label="Info"
            >
              <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#1EA779"
            >
              <path d="m414-280 226-226-58-58-169 169-84-84-57 57 142 142ZM260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Zm0-80h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41Zm220-240Z" />
            </svg>
          )}
        </div>
        <div>
          {/* Need to be more explicit with the text color to overwrite the default style of toastify. */}
          <h4 className="mb-0.5 text-title-xsm font-medium text-plainfont">{title}</h4>
          <p className="text-sm font-medium text-reducedfont">{detail}</p>
          {link && (
            <button
              className="mt-1 text-sm font-medium text-primary underline hover:opacity-80"
              onClick={(e) => {
                // Keep the toast itself from swallowing/handling the click.
                e.stopPropagation();
                link.onClick();
              }}
            >
              {link.label}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SuccessNotification;
