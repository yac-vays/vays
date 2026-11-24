/**
 * A render error in the routed page shows a message in place of the page
 * instead of unmounting the whole app; the next location starts fresh.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import PageErrorBoundary from '../../src/view/components/PageErrorBoundary';

const Broken = (): JSX.Element => {
  throw new TypeError('cell cannot be rendered');
};

afterEach(() => vi.restoreAllMocks());

test('a throwing page is replaced by an error message, the rest stays', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <div>
      <nav>sidebar</nav>
      <PageErrorBoundary resetKey="/b/host">
        <Broken />
      </PageErrorBoundary>
    </div>,
  );
  expect(screen.getByRole('alert').textContent).toContain('This page could not be displayed');
  expect(screen.getByText('sidebar')).toBeTruthy();
  expect(err.mock.calls.some((c) => String(c[0]).includes('cell cannot be rendered'))).toBe(true);
});

test('navigating to another location shows that page again', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { rerender } = render(
    <PageErrorBoundary resetKey="/b/host">
      <Broken />
    </PageErrorBoundary>,
  );
  expect(screen.queryByRole('alert')).not.toBeNull();

  // Same location: the message stays (no render loop of the broken page).
  rerender(
    <PageErrorBoundary resetKey="/b/host">
      <p>other page</p>
    </PageErrorBoundary>,
  );
  expect(screen.queryByRole('alert')).not.toBeNull();

  rerender(
    <PageErrorBoundary resetKey="/b/bucket">
      <p>other page</p>
    </PageErrorBoundary>,
  );
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('other page')).toBeTruthy();
});
