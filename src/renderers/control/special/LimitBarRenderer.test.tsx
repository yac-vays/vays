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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mount = (data: any, options: object, cpuSchema: object = { type: 'number' }) => {
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

const FLOAT = { renderer: 'limit_bar_float', renderer_options: { step: 0.5, unit: 'Cores' } };

afterEach(() => act(() => setYACUsages([])));

describe('LimitBarRenderer', () => {
  it('shows the usage split into this field and the others, with numbers', () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, FLOAT);
    expect(screen.getByTestId('limit-bar')).toBeTruthy();
    expect(screen.getByText('This: 2')).toBeTruthy();
    expect(screen.getByText('Others: 6')).toBeTruthy();
    expect(screen.getByText('Free: 2')).toBeTruthy();
    expect(screen.getByText('8 / 10 Cores')).toBeTruthy();
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuenow')).toBe('2');
    expect(slider.getAttribute('aria-valuemax')).toBe('4'); // room left in the cap
  });

  it('falls back to a plain number input without a matching usage', () => {
    act(() => setYACUsages([{ ...usage(8, 10), path: '#/other' }], { spec: { cpu: 2 } }));
    const { container } = mount({ spec: { cpu: 2 } }, FLOAT);
    expect(screen.queryByTestId('limit-bar')).toBeNull();
    expect(container.querySelector('input[type="number"]')).toBeTruthy();
  });

  it('changes the value with the keyboard (step), committed after the debounce', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { seen } = mount({ spec: { cpu: 2 } }, FLOAT);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    // shown right away, the others stay put
    expect(screen.getByText('This: 2.5')).toBeTruthy();
    expect(screen.getByText('Others: 6')).toBeTruthy();
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(2.5), { timeout: 2000 });
    fireEvent.keyDown(slider, { key: 'End' });
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(4), { timeout: 2000 });
  });

  it('drags the end of the own share and commits on release, clamped to the cap', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    const { seen } = mount({ spec: { cpu: 2 } }, FLOAT);
    const bar = screen.getByRole('slider').parentElement as HTMLElement;
    bar.getBoundingClientRect = () => ({ left: 0, width: 100 }) as DOMRect;
    fireEvent.pointerDown(bar, { clientX: 70, button: 0, pointerId: 1 });
    expect(screen.getByText('This: 1')).toBeTruthy(); // 7 - 6
    fireEvent.pointerMove(bar, { clientX: 100, pointerId: 1 });
    expect(screen.getByText('This: 4')).toBeTruthy(); // clamped: 10 - 6
    fireEvent.pointerUp(bar, { clientX: 100, pointerId: 1 });
    await waitFor(() => expect(seen.data?.spec?.cpu).toBe(4));
  });

  it("never lets the value pass the field's own maximum and marks it on the bar", () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, FLOAT, { type: 'number', maximum: 3 });
    expect(screen.getByTestId('limit-bar-field-max')).toBeTruthy();
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuemax')).toBe('3');
    fireEvent.keyDown(slider, { key: 'End' });
    expect(screen.getByText('This: 3')).toBeTruthy();
  });

  it('counts an unset field with its initial value without writing it', async () => {
    act(() => setYACUsages([usage(8, 10)], { spec: {} }));
    const { seen } = mount(
      { spec: {} },
      { renderer: 'limit_bar_int', initial: 2 },
      { type: 'integer' },
    );
    expect(screen.getByText('This: 2')).toBeTruthy();
    expect(screen.getByText('Others: 6')).toBeTruthy();
    expect(screen.getByTestId('limit-bar-own').style.opacity).toBe('0.5');
    await new Promise((r) => setTimeout(r, 50));
    expect(seen.data?.spec?.cpu).toBeUndefined();
  });

  it('reports limit_bar_float on an integer field as a spec error', () => {
    act(() => setYACUsages([usage(8, 10)], { spec: { cpu: 2 } }));
    mount({ spec: { cpu: 2 } }, { renderer: 'limit_bar_float' }, { type: 'integer' });
    expect(screen.getByRole('slider').getAttribute('aria-disabled')).toBe('true');
  });
});
