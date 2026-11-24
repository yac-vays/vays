import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmAlert from '../../src/view/components/Modal';

const open = (confirm = vi.fn(async () => {}), cancel = vi.fn(async () => {})) => {
  const ref = React.createRef<ConfirmAlert>();
  render(
    <>
      <button>outside</button>
      <ConfirmAlert ref={ref} />
    </>,
  );
  act(() => ref.current!.show('Delete on web01?', 'Sure?', confirm, cancel, 'Delete', false));
  return { ref, confirm, cancel };
};

describe('ConfirmAlert', () => {
  it('ignores clicks outside while it is hidden', async () => {
    const { ref, cancel } = open();
    await act(async () => ref.current!.hide());
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels on a click outside while shown', () => {
    const { cancel } = open();
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('confirms on Enter and keeps the key from the element focused behind it', () => {
    const { confirm } = open();
    const notPrevented = fireEvent.keyDown(screen.getByText('outside'), { code: 'Enter' });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });

  it('leaves Enter on its own buttons to them', () => {
    const { confirm } = open();
    const notPrevented = fireEvent.keyDown(screen.getByText('Cancel'), { code: 'Enter' });
    expect(confirm).not.toHaveBeenCalled();
    expect(notPrevented).toBe(true);
  });
});
