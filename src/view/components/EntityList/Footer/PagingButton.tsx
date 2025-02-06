export const PagingButtonType = {
  PRIMARY: 1,
  SECONDARY: 2,
  RANGEGAP: 3,
};

interface PagingButtonProps {
  buttonType: number;
  content: string;
  callback: () => void;
}

/**
 * Button that is used in the pagination section.
 * @param buttonType the type of button, either primary, secondary or rangegap.
 * @param content what to display on the button
 * @param callback to call when the button is clicked
 * @returns
 */
const PagingButton = ({ buttonType, content, callback }: PagingButtonProps) => {
  {
    switch (buttonType) {
      case PagingButtonType.PRIMARY:
        return (
          <>
            <button
              onClick={callback}
              className="border-b-4 border-primary dark:border-primary-highlighted flex cursor-pointer items-center justify-center rounded p-1 px-3 hover:bg-primary-20 hover:dark:bg-primary-highlighted hover:text-white"
            >
              {content}
            </button>
          </>
        );

      case PagingButtonType.SECONDARY:
        return (
          <>
            <button
              onClick={callback}
              className="flex cursor-pointer items-center justify-center rounded p-1 px-3 hover:bg-primary-20 hover:dark:bg-primary-highlighted hover:text-white"
            >
              {content}
            </button>
          </>
        );
      case PagingButtonType.RANGEGAP:
        return (
          <>
            <span className="mx-1 flex cursor-pointer items-center justify-center rounded p-1 px-3">
              {content}
            </span>
          </>
        );
    }
  }
};

export default PagingButton;
