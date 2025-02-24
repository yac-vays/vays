import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch, JsonFormsStateContext, withJsonFormsContext } from '@jsonforms/react';
import _ from 'lodash';
import React, { ComponentType } from 'react';
import Accordion from '../../../view/components/Accordion';
import ItemDeleteButton from './ItemDeleteButton';

interface DispatchPropsOfCardRenderer {
  onRemove(path: string, index: number): () => void;
}

interface CardRendererProps extends LayoutProps, DispatchPropsOfCardRenderer {
  index: number;
}

export const CardRenderer = (props: CardRendererProps) => {
  const { schema, path, renderers, cells, onRemove } = props;
  const elements = [{ type: 'Control', scope: `#` }];
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
  return (
    <Accordion title={(props.index + 1).toString()}>
      <div className="group flex flex-row w-full">
        <div className="grow">{itemsToRender}</div>

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
      React.memo(Component, (prevProps, props) => _.isEqual(prevProps, props)),
    ),
  );
};

export default withCustomProps(CardRenderer);
