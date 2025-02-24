import { ArrayLayoutProps, ArrayTranslations, LayoutProps, Paths } from '@jsonforms/core';
import { WithDeleteDialogSupport } from '@jsonforms/material-renderers';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  useJsonForms,
  withJsonFormsContext,
} from '@jsonforms/react';
import _ from 'lodash';
import React, { ComponentType } from 'react';
import ItemDeleteButton from '../NestedObjectRenderer/ItemDeleteButton';

interface DispatchPropsOfItem {
  onRemove(): () => void;
}

interface ItemRendererProps extends LayoutProps, DispatchPropsOfItem {
  index: number;
  openDeleteDialog: (p: string, rowIndex: number) => () => void;
}

const withContextToRowItem =
  (Component: ComponentType<ItemRendererProps>): ComponentType<ItemRendererProps> =>
  ({ props }: JsonFormsStateContext & ItemRendererProps) => {
    const ctx = useJsonForms();

    return <Component {...props} {...ctx} />;
  };

const withCustomProps = (Component: ComponentType<ItemRendererProps>) => {
  return withJsonFormsContext(
    withContextToRowItem(React.memo(Component, (prevProps, props) => _.isEqual(prevProps, props))),
  );
};

const TableRow = withCustomProps((props: ItemRendererProps) => {
  const { schema, path, renderers, cells } = props;

  // const elements = [{ type: 'Control', scope: `#` }]; //.options?.["elements"] ?? [];
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
  return (
    <div>
      <div
        className={`group flex flex-row w-full ${
          elements.length > 1 ? 'border border-[#c9c9c9] rounded p-2 my-2' : ''
        }`}
      >
        <div className="grow">{itemsToRender}</div>

        <ItemDeleteButton
          callback={(e) => {
            e.preventDefault();
            e.currentTarget.blur();
            props.openDeleteDialog(path, props.index)();
          }}
          enabled={props.enabled}
        />
      </div>
    </div>
  );
});

export class Table extends React.Component<
  ArrayLayoutProps & WithDeleteDialogSupport & { translations: ArrayTranslations },
  unknown
> {
  addItem = (path: string, value: string) => this.props.addItem(path, value);

  render() {
    return (
      <>
        {/* <FormComponentTitle
          label={this.props.label}
          onClick={() => {
            this.addItem(
              this.props.path,
              createDefaultValue(this.props.schema, this.props.rootSchema),
            )();
          }}
          description={this.props.description}
          required={this.props.required}
        /> */}
        {this.props.data == 0 ? (
          <div className="w-full items-center justify-center text-center py-8">No data...</div>
        ) : (
          Array(this.props.data)
            .fill(0)
            .map((_, i) => {
              return (
                <TableRow
                  key={i}
                  index={i}
                  schema={this.props.schema}
                  uischema={this.props.uischema}
                  path={Paths.compose(this.props.path, `${i}`)}
                  renderers={this.props.renderers}
                  cells={this.props.cells}
                  onRemove={this.props.removeItems}
                  openDeleteDialog={this.props.openDeleteDialog}
                  enabled={this.props.enabled}
                />
              );
            })
        )}
      </>
    );
  }
}

export default Table;
