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
        className="duration-300 flex cursor-pointer items-center justify-center rounded p-1 pr-2 hover:scale-150"
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
