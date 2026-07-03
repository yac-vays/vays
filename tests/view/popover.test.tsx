/**
 * The shared Popover primitive (see src/view/components/Popover): the one
 * popup mechanism behind description/error info boxes, log panels and the
 * action dropdown. Pins the interaction contract (click toggles, Escape and
 * outside-press dismiss, portal rendering so scroll containers cannot clip)
 * and the small-screen bottom-sheet mode.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Popover from '../../src/view/components/Popover';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const POPOVER = (
  <div>
    <Popover anchor={<span>trigger</span>}>
      <div>panel-content</div>
    </Popover>
    <span>outside-area</span>
  </div>
);

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).matchMedia;
});

describe('Popover', () => {
  it('opens on click, renders through a portal, closes on outside press', async () => {
    const { container } = render(POPOVER);
    expect(screen.queryByText('panel-content')).toBeNull();

    fireEvent.click(screen.getByText('trigger'));
    const panel = await screen.findByText('panel-content');
    // Portal: the panel is NOT inside the component tree (so overflow/scroll
    // ancestors can never clip it), but a direct child of body.
    expect(container.contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByText('panel-content')).toBeNull());
  });

  it('closes on Escape', async () => {
    render(POPOVER);
    fireEvent.click(screen.getByText('trigger'));
    await screen.findByText('panel-content');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('panel-content')).toBeNull());
  });

  it('never opens when disabled', () => {
    render(
      <Popover anchor={<span>trigger</span>} disabled>
        <div>panel-content</div>
      </Popover>,
    );
    fireEvent.click(screen.getByText('trigger'));
    expect(screen.queryByText('panel-content')).toBeNull();
  });

  it('renders as a bottom sheet on small screens', async () => {
    mockMatchMedia(true); // below the sm breakpoint
    render(POPOVER);
    fireEvent.click(screen.getByText('trigger'));
    const panel = await screen.findByText('panel-content');
    // Sheet mode: fixed full-screen layer with a backdrop; content pinned to
    // the bottom edge instead of being anchored to the trigger.
    const sheet = panel.parentElement;
    expect(sheet?.className).toContain('bottom-0');
    expect(sheet?.className).toContain('inset-x-0');
    expect(sheet?.parentElement?.className).toContain('fixed');
  });

  it('reports open state changes to the trigger (chevron rotation)', async () => {
    const seen: boolean[] = [];
    render(
      <Popover anchor={<span>trigger</span>} onOpenChange={(v) => seen.push(v)}>
        <div>panel-content</div>
      </Popover>,
    );
    fireEvent.click(screen.getByText('trigger'));
    await screen.findByText('panel-content');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('panel-content')).toBeNull());
    expect(seen).toStrictEqual([true, false]);
  });
});
