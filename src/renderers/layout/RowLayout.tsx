import {
  Layout,
  LayoutProps,
  RankedTester,
  rankWith,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

/**
 * Fields next to each other: consecutive Controls of a category or group
 * sharing the same `vays_options.row` (any string/number, it only has to be
 * equal) are rendered side by side, wrapping onto the next line when the
 * space runs out (narrow screens).
 *
 * The grouping happens at render time ({@link groupIntoRows} wraps such runs
 * into a synthetic `VaysRow` layout element); the UI-Schema YAC delivered is
 * left untouched, so everything else walking it (tab error badges, lint, ...)
 * keeps seeing plain Controls.
 */
export const ROW_LAYOUT_TYPE = 'VaysRow';

interface RowLayoutElement extends Layout {
  type: typeof ROW_LAYOUT_TYPE;
}

function rowKey(e: UISchemaElement): string | number | undefined {
  const row = e.type === 'Control' ? e.options?.row : undefined;
  return typeof row === 'string' || typeof row === 'number' ? row : undefined;
}

/**
 * Wrap every run of at least two consecutive Controls with the same
 * `options.row` into a `VaysRow` element. Returns the input array itself
 * when there is nothing to group.
 */
export function groupIntoRows(elements: UISchemaElement[]): UISchemaElement[] {
  if (!elements.some((e) => rowKey(e) !== undefined)) return elements;
  const out: UISchemaElement[] = [];
  let i = 0;
  while (i < elements.length) {
    const key = rowKey(elements[i]);
    let j = i + 1;
    if (key !== undefined) {
      while (j < elements.length && rowKey(elements[j]) === key) j++;
    }
    if (j - i >= 2) {
      out.push({ type: ROW_LAYOUT_TYPE, elements: elements.slice(i, j) } as RowLayoutElement);
    } else {
      out.push(elements[i]);
    }
    i = j;
  }
  return out;
}

const RowLayout = ({ uischema, schema, path, enabled, visible, renderers, cells }: LayoutProps) => {
  if (!visible) return <></>;
  return (
    <div className="flex flex-row flex-wrap gap-x-3" data-testid="vays-row">
      {(uischema as RowLayoutElement).elements.map((child, idx) => (
        <div key={`${path}-${idx}`} className="min-w-56 flex-1 basis-0">
          <JsonFormsDispatch
            uischema={child}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        </div>
      ))}
    </div>
  );
};

export const rowLayoutTester: RankedTester = rankWith(21, uiTypeIs(ROW_LAYOUT_TYPE));

export default withJsonFormsLayoutProps(React.memo(RowLayout));
