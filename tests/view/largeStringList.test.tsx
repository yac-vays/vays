import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LargeStringList from '../../src/view/thirdparty/components/ifc/LargeStringList/LargeStringList';

const mount = (disabled = false) => {
  const handleChange = vi.fn();
  render(
    <LargeStringList handleChange={handleChange} path="list" data={['x']} disabled={disabled} />,
  );
  return handleChange;
};

// The (x) of the first chip (the last button clears the whole list).
const removeFirst = () => fireEvent.click(screen.getAllByRole('button')[0]);

describe('LargeStringList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not change anything while disabled', () => {
    const handleChange = mount(true);
    removeFirst();
    vi.advanceTimersByTime(2000);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('lets a removal supersede a pending add', () => {
    const handleChange = mount();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    removeFirst();
    vi.advanceTimersByTime(2000);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('list', ['a']);
  });
});
