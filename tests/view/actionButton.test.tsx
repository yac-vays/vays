import { act, fireEvent, render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { GUIActionButtonArg } from '../../src/utils/types/internal/actions';
import ActionButton from '../../src/view/components/Buttons/ActionButton';

it('runs a non-dangerous action once per click, also when it fails', async () => {
  let fail!: (e: Error) => void;
  const performAction = vi.fn(
    () =>
      new Promise<void>((_, reject) => {
        fail = reject;
      }),
  );
  const actArgs = {
    action: { name: 'reboot', title: 'Reboot', icon: '', dangerous: false },
    isAllowed: true,
    performAction,
  } as unknown as GUIActionButtonArg;
  const { container } = render(<ActionButton actArgs={actArgs} isLeft />);
  const button = container.firstElementChild as HTMLElement;

  fireEvent.click(button);
  fireEvent.click(button);
  expect(performAction).toHaveBeenCalledTimes(1);

  // A failed run must not leave the button busy forever.
  await act(async () => {
    fail(new Error('boom'));
    await Promise.resolve();
  });
  fireEvent.click(button);
  expect(performAction).toHaveBeenCalledTimes(2);
});
