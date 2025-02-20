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
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import MultiSelect from '../../view/thirdparty/components/ifc/MultiSelect/MultiSelect';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

export const MultipleChoiceRenderer = ({
  // config,
  id,
  schema,
  uischema,
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

  // placeholder is always editable for here for now
  // TODO: revisit?
  if (data == undefined) {
    data = uischema.options?.initial;
  }

  if (!isOfTypeWeak(data, schema.type, true)) {
    errors = reportBadData(data);
    data = undefined;
  } else if (data != undefined) {
    // For some reason, json forms does not hand over errors
    // about unavailable option in the data...
    for (const elt of data) {
      if (options.filter((v) => v.value === elt).length == 0) {
        errors = 'Not allowed element: ' + elt;
        break;
      }
    }
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
