import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import { ReactNode } from 'react';
import FormComponentTitle from '../../view/components/FormComponentTitle';
import { BooleanControl } from '../control/BooleanControlRenderer';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import { isCustomRenderer } from '../utils/customTesterUtils';

interface Option {
  label: string;
  value: string;
}

export const MultiCheckboxRenderer = ({
  config,
  id,
  schema,
  visible,
  errors,
  description,
  label,
  required,
  path,
  options,
  data,
  addItem,
  removeItem,
  // handleChange: _handleChange,
  ...otherProps
}: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl) => {
  if (!visible || !options || !removeItem) {
    return null;
  }

  return (
    <div>
      <FormComponentTitle
        label={label}
        description={description}
        onClick={() => {}}
        required={required}
        hideAddButton
      />
      <ErrorBox displayError={errors} />

      <div className="flex flex-row flex-wrap">
        {options.map((option: Option, index: number) => {
          const optionPath = Paths.compose(path, `${index}`);
          const checkboxValue = data?.includes(option.value); // ? option.value : undefined;
          console.log(checkboxValue);
          const n: ReactNode = (
            <BooleanControl
              label={option.label}
              id={id + '-' + option.value}
              data={checkboxValue}
              visible={visible}
              schema={schema}
              handleChange={(_path, newValue) =>
                newValue ? addItem(path, option.value) : removeItem(path, option.value)
              }
              errors={''}
              path={optionPath}
              config={config}
              description={description}
              uischema={otherProps.uischema}
              rootSchema={otherProps.rootSchema}
              enabled={otherProps.enabled}
            />
          );

          return n;
        })}
      </div>
    </div>
  );
};

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && schema.enum !== undefined;
const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });
export const MultiCheckboxTester: RankedTester = rankWith(
  31,
  and(
    uiTypeIs('Control'),
    and(
      and(
        isCustomRenderer('multi_checkbox'),
        schemaMatches(
          (schema) =>
            hasType(schema, 'array') && !Array.isArray(schema.items) && schema.uniqueItems === true,
        ),
      ),
      schemaSubPathMatches('items', (schema, rootSchema) => {
        const resolvedSchema = schema.$ref
          ? resolveSchema(rootSchema, schema.$ref, rootSchema)
          : schema;
        return hasOneOfItems(resolvedSchema) || hasEnumItems(resolvedSchema);
      }),
    ),
  ),
);

export default withJsonFormsMultiEnumProps(MultiCheckboxRenderer);
