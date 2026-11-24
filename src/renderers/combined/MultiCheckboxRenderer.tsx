import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import { ReactNode } from 'react';
import ErrorRing from '../../view/components/Form/ErrorRing';
import FormComponentTitle from '../../view/components/FormComponentTitle';
import { BooleanControl } from '../control/BooleanControlRenderer';
import { isCustomRenderer, itemsAreChoices } from '../utils/customTesterUtils';
import { matchesJsonType, reportBadData } from '../utils/dataSanitization';
import { resolveInitial } from '../utils/initialHandling';

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
  handleChange,
  ...otherProps
}: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl) => {
  if (!visible || !options || !removeItem) {
    return null;
  }

  if (!matchesJsonType(data, schema.type, true)) {
    errors = reportBadData(data);
    data = undefined;
  }

  // `initial` is shown but is not data yet; with `initial_editable: false`
  // (the default) the pre-ticked boxes are greyed out until the user toggles
  // one. Resolved here at the group level: the children must always receive a
  // real boolean, otherwise they would fall back to the group's (array-typed)
  // `initial` themselves and report bad data.
  const { data: shownData, isPlaceholder } = resolveInitial<(string | number)[]>(
    data,
    otherProps.uischema,
  );

  const toggle = (value: string, ticked: boolean) => {
    if (data === undefined && shownData !== undefined) {
      // First interaction while showing `initial`: commit the whole shown
      // selection so the other pre-ticked boxes become data too.
      handleChange(path, ticked ? [...shownData, value] : shownData.filter((v) => v !== value));
    } else if (ticked) {
      addItem(path, value);
    } else {
      removeItem(path, value);
    }
  };

  return (
    // p-1 like the other controls' wrappers: gives the ErrorRing (drawn
    // outside the box) room, so it is not clipped by the scrolling form pane.
    <div className="p-1">
      <FormComponentTitle
        label={label}
        description={description}
        required={required}
        errors={errors}
        path={path}
      />

      {/* The group description lives on the title above; repeating it on
          every checkbox would just duplicate the info button N times. */}
      <ErrorRing errors={errors}>
        <div className={`flex flex-row flex-wrap ${isPlaceholder ? 'opacity-60' : ''}`}>
          {options.map((option: Option, index: number) => {
            const optionPath = Paths.compose(path, `${index}`);
            const checkboxValue = shownData?.includes(option.value) ?? false;
            const n: ReactNode = (
              <BooleanControl
                key={option.value ?? index}
                label={option.label}
                id={id + '-' + option.value}
                data={checkboxValue}
                visible={visible}
                schema={schema}
                handleChange={(_path, newValue) => toggle(option.value, newValue)}
                errors={''}
                path={optionPath}
                config={config}
                uischema={otherProps.uischema}
                rootSchema={otherProps.rootSchema}
                enabled={otherProps.enabled}
              />
            );

            return n;
          })}
        </div>
      </ErrorRing>
    </div>
  );
};

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
      itemsAreChoices,
    ),
  ),
);

export default withJsonFormsMultiEnumProps(MultiCheckboxRenderer);
