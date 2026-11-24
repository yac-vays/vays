import { PAGE_GAP, pageButtons } from './pageButtons';
import PagingButton, { PagingButtonType } from './PagingButton';

export const EntityListPagination = ({
  pageSwitch,
  currPage,
  totalNumResults,
  numResultsPerPage,
}: {
  pageSwitch: (to: number) => () => void;
  currPage: number;
  totalNumResults: number;
  numResultsPerPage: number;
}) => {
  const maxPages = Math.ceil(totalNumResults / numResultsPerPage);
  return (
    <div className="flex">
      <button
        className="duration-300 flex cursor-pointer items-center justify-center rounded-sm p-1 pr-2 hover:scale-150"
        disabled={false}
        onClick={() => {
          if (currPage > 1) {
            pageSwitch(currPage - 1)();
          }
        }}
      >
        <svg
          className="fill-current"
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="none"
        >
          <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
        </svg>
      </button>
      {pageButtons(currPage, maxPages).map((button, i) =>
        button === PAGE_GAP ? (
          <PagingButton
            key={i}
            content="..."
            buttonType={PagingButtonType.RANGEGAP}
            callback={() => {}}
          />
        ) : (
          <PagingButton
            key={i}
            content={`${button}`}
            buttonType={button === currPage ? PagingButtonType.PRIMARY : PagingButtonType.SECONDARY}
            callback={pageSwitch(button)}
          />
        ),
      )}
      <button
        className="duration-300 flex cursor-pointer items-center justify-center rounded-sm p-1 px-2 hover:scale-150"
        onClick={() => {
          if (currPage < maxPages) {
            pageSwitch(currPage + 1)();
          }
        }}
      >
        <svg
          className="fill-current"
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="none"
        >
          <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </svg>
      </button>
    </div>
  );
};
