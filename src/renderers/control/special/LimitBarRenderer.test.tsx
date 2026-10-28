import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { customRenderers } from '../..';
import { setYACUsages } from '../../../controller/local/EditController/shared';
import { LimitUsage } from '../../../utils/types/api';

const renderers = [...materialRenderers, ...customRenderers];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemaFor = (cpu: any) => ({
  type: 'object',
  properties: { spec: { type: 'object', properties: { cpu } } },
});

const uischemaFor = (options: object) => ({
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Quotas',
      elements: [{ type: 'Control', scope: '#/properties/spec/properties/cpu', options }],
    },
  ],
});

const usage = (used: number, max: number): LimitUsage => ({
  title: 'CPU per OU',
  used,
  max,
  ok: used <= max,
  path: '#/spec/cpu',
});

const mount = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  options: object,
  cpuSchema: object = { type: 'number', multipleOf: 0.5 },
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen: { data?: any } = {};
  const utils = render(
    <JsonForms
      schema={schemaFor(cpuSchema)}
      uischema={uischemaFor(options)}
      data={data}
      renderers={renderers}
      cells={materialCells}
      onChange={({ data: d }) => {
        seen.data = d;
      }}
    />,
  );
  return { seen, ...utils };
};

const BAR = { renderer: 'limit_bar', renderer_options: { unit: 'Cores' } };

const own = () => screen.getByRole('slider').getAttribute('aria-valuenow');
const chip = () => screen.getByTestId('limit-bar-chip').textContent;

afterEach(() => act(() => setYACUsages([])));

describe('LimitBarRenderer', () => {
  it('shows the usage as a chip, with the split in its popover', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, BAR);
    expect(screen.getByTestId('limit-bar')).toBeTruthy();
    expect(chip()).toBe('8 / 10 Cores');
    expect(screen.queryByText(/Others:/)).toBeNull(); // details only on demand
    fireEvent.click(screen.getByTestId('limit-bar-chip'));
    const details = await screen.findByText(/Others: 6 Cores/);
    expect(details.textContent).toContain('This entity: 2 Cores');
    expect(details.textContent).toContain('Free: 2 Cores');
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuenow')).toBe('2');
    expect(slider.getAttribute('aria-valuemax')).toBe('4'); // room left in the cap
  });

  it("colors this entity's share by level", () => {
    act(() => setYACUsages([usage(4, 10)], { spec: { cpu: 2 } }));
    const { unmount } = mount({ spec: { cpu: 2 } }, BAR);
    expect(screen.getByTestId('limit-bar-own').style.backgroundColor).toBe('rgb(34, 197, 94)');
    unmount();
    act(() => setYACUsages([usage(9, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, BAR);
    expect(screen.getByTestId('limit-bar-own').style.backgroundColor).toBe('rgb(245, 158, 11)');
  });

  it('unsets the value with the × in the input (back to the initial value)', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { seen } = mount({ spec: { cpu: 2 } }, { ...BAR, initial: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    await waitFor(() => expect(seen.data?.spec).toEqual({}));
    expect(own()).toBe('1');
    expect(screen.queryByRole('button', { name: 'Reset to default' })).toBeNull();
  });

  it('hides the spinner of the number input next to the bar (the bar steps)', () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { container } = mount({ spec: { cpu: 2 } }, BAR);
    expect(container.querySelector('input[type="number"]')?.className).toContain(
      '[appearance:textfield]',
    );
  });

  it('falls back to a plain number input without a matching usage', () => {
    act(() => setYACUsages([{ ...usage(8, 10), path: '#/other' }], { spec: { cpu: 2 } }));
    const { container } = mount({ spec: { cpu: 2 } }, BAR);
    expect(screen.queryByTestId('limit-bar')).toBeNull();
    expect(container.querySelector('input[type="number"]')).toBeTruthy();
  });

  it('changes the value with the keyboard (step), committed after the debounce', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { seen } = mount({ spec: { cpu: 2 } }, BAR);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    // shown right away, the others stay put
    expect(own()).toBe('2.5');
    expect(chip()).toBe('8.5 / 10 Cores');
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(2.5), { timeout: 2000 });
    fireEvent.keyDown(slider, { key: 'End' });
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(4), { timeout: 2000 });
  });

  it('drags the end of the own share and commits on release, clamped to the cap', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { seen } = mount({ spec: { cpu: 2 } }, BAR);
    const bar = screen.getByRole('slider').parentElement as HTMLElement;
    bar.getBoundingClientRect = () => ({ left: 0, width: 100 }) as DOMRect;
    fireEvent.pointerDown(bar, { clientX: 70, button: 0, pointerId: 1 });
    expect(own()).toBe('1'); // 7 - 6
    fireEvent.pointerMove(bar, { clientX: 100, pointerId: 1 });
    expect(own()).toBe('4'); // clamped: 10 - 6
    fireEvent.pointerUp(bar, { clientX: 100, pointerId: 1 });
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(4));
  });

  it("never lets the value pass the field's own maximum and marks it on the bar", () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, BAR, { type: 'number', multipleOf: 0.5, maximum: 3 });
    expect(screen.getByTestId('limit-bar-field-max')).toBeTruthy();
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuemax')).toBe('3');
    fireEvent.keyDown(slider, { key: 'End' });
    expect(own()).toBe('3');
  });

  it('counts an unset field with its initial value without writing it', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: {} }));
    const { seen } = mount(
      { spec: {} },
      { renderer: 'limit_bar', initial: 2 },
      { type: 'integer' },
    );
    expect(own()).toBe('2');
    expect(chip()).toBe('8 / 10');
    expect(screen.getByTestId('limit-bar-own').style.opacity).toBe('0.5');
    await new Promise((r) => setTimeout(r, 50));
    expect(seen.data?.spec?.cpu).toBeUndefined();
  });

  it('steps by multipleOf, else by 1 for integers', async () => {
    act(() => setYACUsages([usage(20, 100)], { spec: { cpu: 10 } }));
    const { seen, unmount } = mount({ spec: { cpu: 10 } }, BAR, {
      type: 'integer',
      multipleOf: 10,
    });
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(own()).toBe('20');
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(20), { timeout: 2000 });
    unmount();
    mount({ spec: { cpu: 10 } }, BAR, { type: 'integer' });
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(own()).toBe('11');
  });

  it('lets the number input step by multipleOf', () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { container, unmount } = mount({ spec: { cpu: 2 } }, BAR, {
      type: 'number',
      multipleOf: 0.005,
    });
    expect(container.querySelector('input[type="number"]')?.getAttribute('step')).toBe('0.005');
    unmount();
    const plain = mount({ spec: { cpu: 2 } }, BAR, { type: 'number' });
    expect(plain.container.querySelector('input[type="number"]')?.hasAttribute('step')).toBe(false);
  });
});
