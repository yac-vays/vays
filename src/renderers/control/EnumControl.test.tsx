import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '..';

const renderers = [...materialRenderers, ...customRenderers];

const uischema = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/flavor' }],
};

const mount = (
  flavorSchema: object,
  { options, required }: { options?: object; required?: boolean } = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen: { data?: any } = {};
  render(
    <JsonForms
      schema={{
        type: 'object',
        properties: { flavor: flavorSchema },
        ...(required ? { required: ['flavor'] } : {}),
      }}
      uischema={{ ...uischema, elements: [{ ...uischema.elements[0], options }] }}
      data={{}}
      renderers={renderers}
      cells={materialCells}
      onChange={({ data }) => {
        seen.data = data;
      }}
    />,
  );
  return seen;
};

const FLAVOR = {
  type: 'string',
  title: 'Flavor',
  oneOf: [
    { const: 'none', title: 'None (plain)' },
    { const: 'b', title: 'Beta', description: 'Second option' },
  ],
};

const selected = () => {
  const select = screen.getByRole('combobox') as HTMLSelectElement;
  return select.options[select.selectedIndex].textContent;
};

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

  it('names the empty option after the initial one and keeps it selected while unset', async () => {
    // (JsonForms debounces onChange, hence waitFor)
    const seen = mount(FLAVOR, { options: { initial: 'b' } });
    expect(selected()).toBe('Default: Beta');
    // the default's description is shown for it
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(within(await screen.findByRole('dialog')).getByText('Second option')).toBeDefined();

    // picking the option itself pins it, the default option unsets it again
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'b' } });
    await waitFor(() => expect(seen.data).toEqual({ flavor: 'b' }));
    expect(selected()).toBe('Beta');
    fireEvent.change(select, { target: { value: '' } });
    await waitFor(() => expect(seen.data).toEqual({}));
    expect(selected()).toBe('Default: Beta');
  });

  it('calls the empty option "Not set" without an initial', () => {
    mount(FLAVOR);
    expect(selected()).toBe('Not set');
  });

  it('preselects the initial option of a required field (no empty option to pick)', () => {
    mount(FLAVOR, { options: { initial: 'b' }, required: true });
    expect(selected()).toBe('Beta');
    const empty = (screen.getByRole('combobox') as HTMLSelectElement).options[0];
    expect(empty.textContent).toBe('Choose one');
    expect(empty.disabled).toBe(true);
  });
});
