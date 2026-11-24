/** Placeholder for the pages left out between two page buttons. */
export const PAGE_GAP = 'gap';

/**
 * The page buttons to offer: every page up to 7 pages, otherwise the first,
 * the last and the current page with its neighbours, with gaps in between.
 */
export function pageButtons(page: number, maxPages: number): (number | typeof PAGE_GAP)[] {
  if (maxPages <= 7) return Array.from({ length: Math.max(maxPages, 0) }, (_, i) => i + 1);

  const pages = [...new Set([1, page - 1, page, page + 1, maxPages])]
    .filter((p) => p >= 1 && p <= maxPages)
    .sort((a, b) => a - b);
  const buttons: (number | typeof PAGE_GAP)[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) buttons.push(PAGE_GAP);
    buttons.push(p);
  });
  return buttons;
}
