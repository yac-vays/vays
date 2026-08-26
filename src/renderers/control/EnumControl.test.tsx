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
  it('shows an info button listing the markdown descriptions of the oneOf consts', async () => {
    mount({
      type: 'string',
      title: 'Flavor',
      oneOf: [
        { const: 'a', title: 'Alpha', description: '**First** option' },
        { const: 'b', title: 'Beta', description: 'Second option' },
      ],
    });

    const [infoButton] = screen.getAllByRole('button');
    expect(infoButton).toBeDefined();
    fireEvent.click(infoButton);

    // Panel lists every option label with its markdown-rendered description.
    const panel = within(await screen.findByRole('dialog'));
    expect(panel.getByText('Alpha')).toBeDefined();
    expect(panel.getByText('First')).toBeDefined();
    expect(panel.getByText('Beta')).toBeDefined();
    expect(panel.getByText('Second option')).toBeDefined();
  });

  it('shows no info button when no option has a description (plain enum)', () => {
    mount({ type: 'string', title: 'Flavor', enum: ['a', 'b'] });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
