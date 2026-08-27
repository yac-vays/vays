import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '../..';
import { injectEagerRandomStrings, resetEagerGenerated } from '../../../utils/schema/eagerValues';
import { ValidateResponse } from '../../../utils/types/internal/validation';

const renderers = [...materialRenderers, ...customRenderers];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const schema = {
  type: 'object',
  properties: {
    token: { type: 'string', title: 'Token' },
  },
};

const uischemaFor = (options: object) => ({
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'General',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/token',
          options,
        },
      ],
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mount = (data: any, options: object) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen: { data?: any } = {};
  const utils = render(
    <JsonForms
      schema={schema}
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

describe('RandomStringRenderer', () => {
  it('auto-generates a uuid into the form data on mount (survives the provider updateCore effect)', async () => {
    const { seen } = mount({}, { renderer: 'random_string', renderer_options: { format: 'uuid' } });
    await waitFor(() => {
      expect(seen.data?.token).toMatch(UUID_RE);
    });
  });

  it('auto-generates with the default format and length when no options are given', async () => {
    const { seen } = mount({}, { renderer: 'random_string' });
    await waitFor(() => {
      expect(seen.data?.token).toMatch(/^[A-Za-z0-9]{32}$/);
    });
  });

  it('dispatches and generates inside an object Control options.detail (vays_object_details shape)', async () => {
    const objSchema = {
      type: 'object',
      properties: {
        identity: {
          title: 'Identity',
          type: 'object',
          properties: {
            uuid: { title: 'UUID', type: 'string' },
            hostname: { title: 'Hostname', type: 'string' },
          },
        },
      },
    };
    const objUischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'NOVA',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/identity',
              options: {
                detail: {
                  type: 'Group',
                  label: 'Identity',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/uuid',
                      options: {
                        renderer: 'random_string',
                        renderer_options: { format: 'uuid' },
                      },
                    },
                    { type: 'Control', scope: '#/properties/hostname' },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen: { data?: any } = {};
    const { getByText } = render(
      <JsonForms
        schema={objSchema}
        uischema={objUischema}
        data={{}}
        renderers={renderers}
        cells={materialCells}
        onChange={({ data: d }) => {
          seen.data = d;
        }}
      />,
    );
    // The custom renderer is really dispatched (its Regenerate button exists)...
    await waitFor(() => {
      expect(getByText('Regenerate')).toBeTruthy();
    });
    // ...and the generated value lands under the nested data path.
    await waitFor(() => {
      expect(seen.data?.identity?.uuid).toMatch(UUID_RE);
    });
  });

  it('treats an eagerly generated value as its own: Regenerate replaces it without a dialog', async () => {
    resetEagerGenerated();
    const options = { renderer: 'random_string', renderer_options: { format: 'uuid' } };
    // The create-mode load flow: the eager pass fills the data before mount.
    const valResp = {
      json_schema: schema,
      ui_schema: uischemaFor(options),
      data: {},
      valid: true,
      detail: '',
    } as ValidateResponse;
    injectEagerRandomStrings(valResp);
    const initial = valResp.data.token as string;
    expect(initial).toMatch(UUID_RE);

    const { seen, getByText } = mount(valResp.data, options);
    // No ModalContextProvider is mounted here: if the renderer asked for the
    // YAC-value confirmation dialog, this click would throw instead of
    // replacing the value.
    await waitFor(() => {
      expect(getByText('Regenerate')).toBeTruthy();
    });
    fireEvent.click(getByText('Regenerate'));
    await waitFor(() => {
      expect(seen.data?.token).toMatch(UUID_RE);
      expect(seen.data?.token).not.toBe(initial);
    });
  });

  it('keeps a value supplied by YAC instead of generating', async () => {
    const { seen, getByDisplayValue } = mount(
      { token: 'from-yac' },
      { renderer: 'random_string', renderer_options: { format: 'uuid' } },
    );
    await waitFor(() => {
      expect(getByDisplayValue('from-yac')).toBeTruthy();
    });
    // Give the (deferred) auto-generation a tick to prove it does NOT fire.
    await new Promise((r) => setTimeout(r, 20));
    expect(seen.data?.token ?? 'from-yac').toBe('from-yac');
  });
});
