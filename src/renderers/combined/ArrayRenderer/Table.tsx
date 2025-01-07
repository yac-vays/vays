import {
  ArrayLayoutProps,
  ArrayTranslations,
  composePaths,
  createDefaultValue,
  LayoutProps,
  Paths,
  resolveSchema,
} from '@jsonforms/core';
import { WithDeleteDialogSupport } from '@jsonforms/material-renderers';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  useJsonForms,
  withJsonFormsContext,
} from '@jsonforms/react';
import _ from 'lodash';
import React, { ComponentType } from 'react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';

interface DispatchPropsOfItem {
  onRemove(): () => void;
}

interface ItemRendererProps extends LayoutProps, DispatchPropsOfItem {
  index: number;
}

const withContextToRowItem =
  (Component: ComponentType<ItemRendererProps>): ComponentType<ItemRendererProps> =>
  ({ ctx2, props }: JsonFormsStateContext & ItemRendererProps) => {
    const ctx = useJsonForms();

    return <Component {...props} {...ctx} />;
  };

const withCustomProps = (Component: ComponentType<ItemRendererProps>) => {
  return withJsonFormsContext(
    withContextToRowItem(React.memo(Component, (prevProps, props) => _.isEqual(prevProps, props))),
  );
};

const TableRow = withCustomProps((props: ItemRendererProps) => {
  const { uischema, schema, path, renderers, cells, onRemove } = props;

  const elements = [{ type: 'Control', scope: `#` }]; //.options?.["elements"] ?? [];
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
    <div>
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
                props.openDeleteDialog(path, props.index)();
              }}
              className="text-[#98A6AD] hover:text-body grow items-center justify-center"
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
    </div>
  );
});

export class Table extends React.Component<
  ArrayLayoutProps & WithDeleteDialogSupport & { translations: ArrayTranslations },
  any
> {
  addItem = (path: string, value: any) => this.props.addItem(path, value);

  render() {
    const subschema = resolveSchema(
      this.props.schema,
      this.props.uischema.scope,
      this.props.rootSchema,
    );
    // console.log(subschema);
    // console.log(this.props.uischema.scope);
    // if (!subschema)
    //   subschema = resolveSchema(
    //     this.props.rootSchema,
    //     this.props.uischema.scope,
    //     this.props.rootSchema,
    //   );

    // console.log('<<<<<<<<<<<<<>>>>>>>>>>>>>>>><<<<<<>>>>>>><<<<<<>>>><<<<<>>>><<');
    // console.log(this.props);
    // console.log(subschema);
    // console.log(resolveSchema(this.props.schema, this.props.path, this.props.schema));

    return (
      <>
        <FormComponentTitle
          label={this.props.label}
          onClick={() => {
            this.addItem(
              this.props.path,
              createDefaultValue(this.props.schema, this.props.rootSchema),
            )();
          }}
          description={this.props.description}
        />
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
                />
              );
            })
        )}
        {/* this.props.removeItems == undefined ? () => {}: this.props.removeItems(this.props.path, [i]) */}
      </>
    );
  }
}

export default Table;
