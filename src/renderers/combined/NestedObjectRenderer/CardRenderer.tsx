import { LayoutProps } from '@jsonforms/core';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  useJsonForms,
  withJsonFormsContext,
} from '@jsonforms/react';
import _ from 'lodash';
import React, { ComponentType, useState } from 'react';
import Accordion from '../../../view/components/Accordion';
import ItemDeleteButton from './ItemDeleteButton';

interface DispatchPropsOfCardRenderer {
  onRemove(path: string, index: number): () => void;
}

interface CardRendererProps extends LayoutProps, DispatchPropsOfCardRenderer {
  index: number;
  /** Mount-time only: a freshly added item starts with its accordion open. */
  expanded?: boolean;
}

export const CardRenderer = (props: CardRendererProps) => {
  const { schema, path, renderers, cells, onRemove } = props;
  const elements = props.uischema.options?.details?.elements
    ? props.uischema.options?.details?.elements
    : [{ type: 'Control', scope: `#` }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemsToRender = elements.map((element: any, index: number) => {
    return (
      <JsonFormsDispatch
        schema={schema}
        uischema={element}
        path={path}
        enabled={props.enabled}
        renderers={renderers}
        cells={cells}
        key={index}
      />
    );
  });
  // Freeze `expanded` at mount: it only encodes "this item was just added, so
  // start it open". Later re-renders (e.g. schema updates from validation
  // responses, or another item becoming the freshly-added one) must not
  // re-sync the accordion and override how the user has since toggled it.
  const [initialExpanded] = useState(props.expanded);
  const labelProp = props.uischema.options?.renderer_options?.item_label_prop;
  const ctx = useJsonForms();
  let title = (props.index + 1).toString();
  if (typeof labelProp === 'string' && ctx.core?.data) {
    const v = _.get(ctx.core.data, path)?.[labelProp];
    if (v != null && v !== '') title = String(v);
  }

  return (
    <Accordion title={title} expanded={initialExpanded}>
      <div className="group flex flex-row w-full">
        {/* min-w-0: see ArrayRenderer/Table.tsx — lets controls shrink in
            narrow panes. */}
        <div className="grow min-w-0">{itemsToRender}</div>

        <ItemDeleteButton
          callback={(e) => {
            e.preventDefault();
            e.currentTarget.blur();
            onRemove(path, props.index)();
          }}
          enabled={props.enabled}
        />
      </div>
    </Accordion>
  );
};

const withContextToCardRender =
  (Component: ComponentType<CardRendererProps>): ComponentType<CardRendererProps> =>
  ({ props }: JsonFormsStateContext & CardRendererProps) => {
    // ^ ctx also exists there
    return <Component {...props} />;
  };

const withCustomProps = (Component: ComponentType<CardRendererProps>) => {
  return withJsonFormsContext(
    withContextToCardRender(
      React.memo(
        Component,
        // Compare only the row-relevant props instead of deep-comparing the
        // whole prop tree on every keystroke. Data changes inside the row
        // reach the dispatched controls through the JSON Forms context (and
        // the title via `useJsonForms`) regardless of this memo.
        (prevProps, props) =>
          prevProps.path === props.path &&
          prevProps.index === props.index &&
          prevProps.enabled === props.enabled &&
          Object.is(prevProps.schema, props.schema) &&
          Object.is(prevProps.uischema, props.uischema) &&
          Object.is(prevProps.renderers, props.renderers) &&
          Object.is(prevProps.cells, props.cells) &&
          Object.is(prevProps.onRemove, props.onRemove),
      ),
    ),
  );
};

export default withCustomProps(CardRenderer);
