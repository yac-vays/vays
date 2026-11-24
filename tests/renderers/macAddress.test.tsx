import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { flushPendingDebouncedInputs } from '../../src/controller/local/EditController/debounceRegistry';
import { customRenderers } from '../../src/renderers';

const renderers = [...materialRenderers, ...customRenderers];

const mount = (options: object, mac: object = { type: 'string' }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen: { data?: any } = {};
  const { container } = render(
    <JsonForms
      schema={{ type: 'object', properties: { mac } }}
      uischema={{
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/mac',
            options: { renderer: 'mac_address', ...options },
          },
        ],
      }}
      data={{}}
      renderers={renderers}
      cells={materialCells}
      onChange={({ data }) => {
        seen.data = data;
      }}
    />,
  );
  return { seen, input: container.querySelector('input') as HTMLInputElement };
};

describe('mac_address', () => {
  it('shows the address the way it is stored', async () => {
    const { seen, input } = mount({});
    fireEvent.change(input, { target: { value: 'aa-bb-cc-dd-ee-ff' } });
    expect(input.value).toBe('AA:BB:CC:DD:EE:FF');
    act(() => flushPendingDebouncedInputs());
    await waitFor(() => expect(seen.data).toEqual({ mac: 'AA:BB:CC:DD:EE:FF' }));
  });

  it('shows the default and the initial value of an unset field', () => {
    expect(mount({}, { type: 'string', default: '00:00:00:00:00:01' }).input.value).toBe(
      '00:00:00:00:00:01',
    );
    expect(mount({ initial: '00:00:00:00:00:02' }).input.placeholder).toBe('00:00:00:00:00:02');
  });
});
