import { ReactNode } from 'react';
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
  return (
    <div className="flex">
      <button
        className="duration-300 flex cursor-pointer items-center justify-center rounded p-1 pr-4 hover:scale-150"
        disabled={false}
        onClick={() => {
          if (currPage > 1) {
            pageSwitch(currPage - 1)();
          }
        }}
      >
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.1777 16.1156C12.009 16.1156 11.8402 16.0593 11.7277 15.9187L5.37148 9.44995C5.11836 9.19683 5.11836 8.80308 5.37148 8.54995L11.7277 2.0812C11.9809 1.82808 12.3746 1.82808 12.6277 2.0812C12.8809 2.33433 12.8809 2.72808 12.6277 2.9812L6.72148 8.99995L12.6559 15.0187C12.909 15.2718 12.909 15.6656 12.6559 15.9187C12.4871 16.0312 12.3465 16.1156 12.1777 16.1156Z"
            fill=""
          ></path>
        </svg>
      </button>
      {(function (): ReactNode[] {
        const maxPages = Math.ceil(totalNumResults.valueOf() / numResultsPerPage.valueOf());
        const page = currPage.valueOf();
        const rangeElt: [string, number, any] = ['...', PagingButtonType.RANGEGAP, () => {}];
        let buttonLayout: [string, number, any][] = [];

        // Edge 1
        if (maxPages <= 7) {
          buttonLayout = [];
          for (let i: number = 1; i <= maxPages; i++) {
            buttonLayout.push([
              `${i}`,
              i == page ? PagingButtonType.PRIMARY : PagingButtonType.SECONDARY,
              pageSwitch(i),
            ]);
          }
        } else if (page == 1) {
          buttonLayout = [
            ['1', PagingButtonType.PRIMARY, pageSwitch(1)],
            ['2', PagingButtonType.SECONDARY, pageSwitch(2)],
            rangeElt,
            [`${maxPages}`, PagingButtonType.SECONDARY, pageSwitch(maxPages)],
          ];
        } else if (page == 2) {
          buttonLayout = [
            ['1', PagingButtonType.SECONDARY, pageSwitch(1)],
            ['2', PagingButtonType.PRIMARY, pageSwitch(2)],
            ['3', PagingButtonType.SECONDARY, pageSwitch(3)],
            rangeElt,
            [`${maxPages}`, PagingButtonType.SECONDARY, pageSwitch(maxPages)],
          ];
        } else if (page == maxPages) {
          buttonLayout = [
            ['1', PagingButtonType.SECONDARY, pageSwitch(1)],
            rangeElt,
            [`${maxPages - 1}`, PagingButtonType.SECONDARY, pageSwitch(maxPages - 1)],
            [`${maxPages}`, PagingButtonType.PRIMARY, pageSwitch(maxPages)],
          ];
        } else if (page == maxPages - 1) {
          buttonLayout = [
            ['1', PagingButtonType.SECONDARY, pageSwitch(1)],
            rangeElt,
            [`${maxPages - 2}`, PagingButtonType.SECONDARY, pageSwitch(maxPages - 2)],
            [`${maxPages - 1}`, PagingButtonType.PRIMARY, pageSwitch(maxPages - 1)],
            [`${maxPages}`, PagingButtonType.SECONDARY, pageSwitch(maxPages)],
          ];
        } else {
          buttonLayout = [['1', PagingButtonType.SECONDARY, pageSwitch(1)]];
          if (Math.max(2, page - 1) != 2) {
            buttonLayout.push(rangeElt);
          }
          for (let i: number = Math.max(2, page - 1); i < Math.min(page + 2, maxPages); i++) {
            buttonLayout.push([
              `${i}`,
              i == page ? PagingButtonType.PRIMARY : PagingButtonType.SECONDARY,
              pageSwitch(i),
            ]);
          }
          if (Math.min(page + 2, maxPages) != maxPages) {
            buttonLayout.push(rangeElt);
          }
          buttonLayout.push([`${maxPages}`, PagingButtonType.SECONDARY, pageSwitch(maxPages)]);
        }

        let jsx: ReactNode[] = [];
        for (let elt of buttonLayout) {
          jsx.push(<PagingButton content={elt[0]} buttonType={elt[1]} callback={elt[2]} />);
        }

        return jsx;
      })()}
      {/* TODO: Make this button a bit more performant by avoiding redundant computation. */}
      <button
        className="duration-300 flex cursor-pointer items-center justify-center rounded p-1 px-2 hover:scale-150"
        onClick={() => {
          if (currPage < Math.ceil(totalNumResults.valueOf() / numResultsPerPage.valueOf())) {
            pageSwitch(currPage + 1)();
          }
        }}
      >
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.82148 16.1156C5.65273 16.1156 5.51211 16.0593 5.37148 15.9468C5.11836 15.6937 5.11836 15.3 5.37148 15.0468L11.2777 8.99995L5.37148 2.9812C5.11836 2.72808 5.11836 2.33433 5.37148 2.0812C5.62461 1.82808 6.01836 1.82808 6.27148 2.0812L12.6277 8.54995C12.8809 8.80308 12.8809 9.19683 12.6277 9.44995L6.27148 15.9187C6.15898 16.0312 5.99023 16.1156 5.82148 16.1156Z"
            fill=""
          ></path>
        </svg>
      </button>
    </div>
  );
};
