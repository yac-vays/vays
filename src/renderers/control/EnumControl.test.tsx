import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '..';

const renderers = [...materialRenderers, ...customRenderers];

const uischema = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/flavor' }],
};

const mount = (flavorSchema: object) =>
  render(
    <JsonForms
      schema={{ type: 'object', properties: { flavor: flavorSchema } }}
      uischema={uischema}
      data={{}}
      renderers={renderers}
      cells={materialCells}
    />,
  );

describe('EnumControl / OneOfEnumControl', () => {
  it('shows an info button with the markdown description of the selected oneOf const', async () => {
    mount({
      type: 'string',
      title: 'Flavor',
      oneOf: [
        { const: 'a', title: 'Alpha', description: '**First** option' },
        { const: 'b', title: 'Beta', description: 'Second option' },
      ],
    });

    // Nothing selected yet -> nothing to describe.
    expect(screen.queryAllByRole('button')).toHaveLength(0);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    const [infoButton] = screen.getAllByRole('button');
    expect(infoButton).toBeDefined();
    fireEvent.click(infoButton);

    // Panel shows the selected option's markdown-rendered description only.
    const panel = within(await screen.findByRole('dialog'));
    expect(panel.getByText('Alpha')).toBeDefined();
    expect(panel.getByText('First')).toBeDefined();
    expect(panel.queryByText('Second option')).toBeNull();
  });

  it('shows no info button when no option has a description (plain enum)', () => {
    mount({ type: 'string', title: 'Flavor', enum: ['a', 'b'] });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
