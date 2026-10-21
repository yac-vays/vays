import { UISchemaElement } from '@jsonforms/core';
import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRenderers } from '..';
import { groupIntoRows, ROW_LAYOUT_TYPE } from './RowLayout';

const renderers = [...materialRenderers, ...customRenderers];

const control = (key: string, row?: string | number): UISchemaElement =>
  ({
    type: 'Control',
    scope: `#/properties/${key}`,
    options: row === undefined ? {} : { row },
  }) as UISchemaElement;

const scopes = (e: UISchemaElement) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((e as any).elements as UISchemaElement[]).map((c: any) => c.scope.split('/').pop());

describe('groupIntoRows', () => {
  it('returns the very same array when no control has a row', () => {
    const els = [control('a'), control('b')];
    expect(groupIntoRows(els)).toBe(els);
  });

  it('wraps runs of consecutive controls with the same row', () => {
    const out = groupIntoRows([
      control('a'),
      control('b', 'cpu'),
      control('c', 'cpu'),
      control('d', 'mem'),
      control('e', 'mem'),
      control('f', 'mem'),
      control('g'),
    ]);
    expect(out.map((e) => e.type)).toEqual([
      'Control',
      ROW_LAYOUT_TYPE,
      ROW_LAYOUT_TYPE,
      'Control',
    ]);
    expect(scopes(out[1])).toEqual(['b', 'c']);
    expect(scopes(out[2])).toEqual(['d', 'e', 'f']);
  });

  it('leaves single and non-consecutive row members alone', () => {
    const els = [control('a', 1), control('b'), control('c', 1)];
    expect(groupIntoRows(els).map((e) => e.type)).toEqual(['Control', 'Control', 'Control']);
  });

  it('does not group non-controls or invalid row values', () => {
    const group = { type: 'Group', elements: [], options: { row: 'x' } } as UISchemaElement;
    const bad = { ...control('b'), options: { row: { x: 1 } } } as UISchemaElement;
    const out = groupIntoRows([group, control('a', 'x'), bad, control('c', 'x')]);
    expect(out.map((e) => e.type)).toEqual(['Group', 'Control', 'Control', 'Control']);
  });
});

describe('RowLayout rendering', () => {
  it('renders the fields of a row side by side inside a group', () => {
    const schema = {
      type: 'object',
      properties: {
        request: { type: 'number', title: 'Request' },
        limit: { type: 'number', title: 'Limit' },
        other: { type: 'string', title: 'Other' },
      },
    };
    const uischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Quotas',
          elements: [
            {
              type: 'Group',
              label: 'CPU',
              elements: [control('request', 'cpu'), control('limit', 'cpu'), control('other')],
            },
          ],
        },
      ],
    };
    render(
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={{}}
        renderers={renderers}
        cells={materialCells}
      />,
    );
    const row = screen.getByTestId('vays-row');
    expect(within(row).getByText('Request')).toBeTruthy();
    expect(within(row).getByText('Limit')).toBeTruthy();
    expect(within(row).queryByText('Other')).toBeNull();
    expect(screen.getByText('Other')).toBeTruthy();
  });
});
