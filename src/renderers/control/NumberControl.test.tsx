import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '..';

const renderers = [...materialRenderers, ...customRenderers];

const stepOf = (n: object) => {
  const { container } = render(
    <JsonForms
      schema={{ type: 'object', properties: { n } }}
      uischema={{
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: 'General',
            elements: [{ type: 'Control', scope: '#/properties/n', options: {} }],
          },
        ],
      }}
      data={{}}
      renderers={renderers}
      cells={materialCells}
    />,
  );
  return container.querySelector('input[type="number"]')?.getAttribute('step');
};

describe('NumberControl', () => {
  it('steps the arrows by multipleOf', () => {
    expect(stepOf({ type: 'number', multipleOf: 0.005 })).toBe('0.005');
    expect(stepOf({ type: 'integer', multipleOf: 10 })).toBe('10');
  });
  it('keeps the browser default without (a usable) multipleOf', () => {
    expect(stepOf({ type: 'number' })).toBeNull();
    expect(stepOf({ type: 'integer', multipleOf: 0.5 })).toBeNull();
  });
});
