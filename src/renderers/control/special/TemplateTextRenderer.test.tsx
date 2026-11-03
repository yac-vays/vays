import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '../..';

const renderers = [...materialRenderers, ...customRenderers];

const schema = {
  type: 'object',
  properties: {
    group: { type: 'string' },
    username: { title: 'User Name', not: {} },
  },
};

const uischemaFor = (options: object) => ({
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/username', options }],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mount = (data: any, options: object) =>
  render(
    <JsonForms
      schema={schema}
      uischema={uischemaFor(options)}
      data={data}
      renderers={renderers}
      cells={materialCells}
    />,
  );

const TEMPLATE = { renderer: 'template_text', renderer_options: { template: 'bkt-{group}-x' } };

describe('template_text renderer', () => {
  it('shows the substituted text and enables Copy', () => {
    const { container } = mount({ group: 'isg' }, TEMPLATE);
    expect(container.textContent).toContain('bkt-isg-x');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
  });

  it('keeps unresolved placeholders and disables Copy', () => {
    const { container } = mount({}, TEMPLATE);
    expect(container.textContent).toContain('bkt-{group}-x');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
  });

  it('reports a missing template', () => {
    mount({}, { renderer: 'template_text' });
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });
});
