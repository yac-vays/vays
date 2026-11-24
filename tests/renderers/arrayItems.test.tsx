import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { flushPendingDebouncedInputs } from '../../src/controller/local/EditController/debounceRegistry';
import { customRenderers } from '../../src/renderers';

const renderers = [...materialRenderers, ...customRenderers];

describe('items of a string array', () => {
  it('are emptied, not turned into null, when their input is cleared', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen: { data?: any } = {};
    const { container } = render(
      <JsonForms
        schema={{
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
        }}
        uischema={{
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/tags' }],
        }}
        data={{ tags: ['a', 'b', 'c'] }}
        renderers={renderers}
        cells={materialCells}
        onChange={({ data }) => {
          seen.data = data;
        }}
      />,
    );
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs).toHaveLength(3);
    fireEvent.change(inputs[1], { target: { value: '' } });
    act(() => flushPendingDebouncedInputs());
    await waitFor(() => expect(seen.data).toEqual({ tags: ['a', '', 'c'] }));
  });
});
