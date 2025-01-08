import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import FormComponentTitle from '../../view/components/FormComponentTitle';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import MultiSelect from '../../view/thirdparty-based-components/ifc/MultiSelect/MultiSelect';

export const MultipleChoiceRenderer = ({
  // config,
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
  removeItem,
  handleChange: _handleChange,
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

      <MultiSelect
        options={options}
        data={data}
        handleChange={_handleChange}
        id={id}
        path={path}
        multiple={!schema.uniqueItems}
      />
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
export const MultipleChoiceTester: RankedTester = rankWith(
  30,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches((schema) => hasType(schema, 'array') && !Array.isArray(schema.items)),
      schemaSubPathMatches('items', (schema, rootSchema) => {
        const resolvedSchema = schema.$ref
          ? resolveSchema(rootSchema, schema.$ref, rootSchema)
          : schema;
        return hasOneOfItems(resolvedSchema) || hasEnumItems(resolvedSchema);
      }),
    ),
  ),
);

export default withJsonFormsMultiEnumProps(MultipleChoiceRenderer);
