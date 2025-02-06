import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch, JsonFormsStateContext, withJsonFormsContext } from '@jsonforms/react';
import _ from 'lodash';
import React, { ComponentType } from 'react';
import Accordion from '../../../view/components/Accordion';

interface DispatchPropsOfCardRenderer {
  onRemove(path: string, index: number): () => void;
}

interface CardRendererProps extends LayoutProps, DispatchPropsOfCardRenderer {
  index: number;
}

export const CardRenderer = (props: CardRendererProps) => {
  const { schema, path, renderers, cells, onRemove } = props;
  const elements = [{ type: 'Control', scope: `#` }];
  const itemsToRender = elements.map((element: any, index: number) => {
    return (
      <JsonFormsDispatch
        schema={schema}
        uischema={element}
        path={path}
        enabled={true}
        renderers={renderers}
        cells={cells}
        key={index}
      />
    );
  });
  return (
    <Accordion title={(props.index + 1).toString()}>
      {/* TODO: Do required star, refactor the title into its own component so it can
    be reused in the nested case. */}
      <div className="group flex flex-row w-full">
        <div className="grow">{itemsToRender}</div>

        <div className="w-[60px] flex items-center justify-center">
          <div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.currentTarget.blur();
                onRemove(path, props.index)();
              }}
              className="text-[#98A6AD] hover:text-plainfont grow items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                className="fill-current"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Accordion>
  );
};

const withContextToCardRender =
  (Component: ComponentType<CardRendererProps>): ComponentType<CardRendererProps> =>
  ({ ctx, props }: JsonFormsStateContext & CardRendererProps) => {
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
