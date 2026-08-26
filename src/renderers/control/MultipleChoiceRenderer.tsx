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
import ErrorRing from '../../view/components/Form/ErrorRing';
import FormComponentTitle from '../../view/components/FormComponentTitle';
import MultiSelect from '../../view/thirdparty/components/ifc/MultiSelect/MultiSelect';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';
import { resolveInitial } from '../utils/initialHandling';

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
  enabled,
  removeItem,
  handleChange: _handleChange,
}: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl) => {
  if (!visible || !options || !removeItem) {
    return null;
  }

  // `initial` is shown but is not data yet; with `initial_editable: false`
  // (the default) the pre-selected chips are greyed out until the user
  // changes the selection (which commits the whole shown array).
  const { data: resolvedData, isPlaceholder } = resolveInitial(data, uischema);
  data = resolvedData;

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
    <div className="p-1">
      <FormComponentTitle
        label={label}
        description={description}
        onClick={() => {}}
        required={required}
        hideAddButton
        errors={errors}
      />

      <ErrorRing errors={errors}>
        <div className={isPlaceholder ? 'opacity-60' : ''}>
          <MultiSelect
            options={options}
            data={data}
            handleChange={_handleChange}
            id={id}
            path={path}
            multiple={!schema.uniqueItems}
            disabled={!enabled}
          />
        </div>
      </ErrorRing>
    </div>
  );
};

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.enum !== undefined &&
  schema.enum.length > 0 &&
  (schema.type === 'string' ||
    (schema.type === undefined && schema.enum.every((v: unknown) => typeof v === 'string')));
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
        return !!resolvedSchema && (hasOneOfItems(resolvedSchema) || hasEnumItems(resolvedSchema));
      }),
    ),
  ),
);

export default withJsonFormsMultiEnumProps(MultipleChoiceRenderer);
