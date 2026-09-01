import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import React from 'react';
// import merge from 'lodash/merge';
import { WithOptionLabel } from '@jsonforms/material-renderers';
import ErrorRing from '../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import SelectStatic from '../../view/thirdparty/components/ifc/Selector/SelectStatic';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';
import { resolveInitial } from '../utils/initialHandling';

/**
 * Shared select control for both `enum` and `oneOf`-enum schemas; only the
 * testers/HOC wrappers differ (see `OneOfEnumControl`).
 */
export const EnumControl = ({
  errors,
  required,
  label,
  handleChange,
  path,
  data,
  description,
  options,
  schema,
  uischema,
  enabled,
}: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  // const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const optionsValueList: (string | undefined)[] = [undefined];
  if (options !== undefined) {
    options.forEach((v) => {
      optionsValueList.push(v.value);
    });
  }

  // Per-option descriptions only exist on oneOf-const schemas (plain `enum`
  // has no place for them); SelectStatic shows the selected option's one in
  // an (i)-panel aligned at the right border of the box.
  const optionsWithDescription = (options || []).map((opt) => ({
    ...opt,
    description: schema.oneOf?.find((sub) => sub.const === opt.value)?.description,
  }));

  // `initial` is shown but is not data yet; with `initial_editable: false`
  // (the default) the pre-selected option is greyed out until the user picks.
  const { data: resolvedData, isPlaceholder } = resolveInitial(data, uischema);
  data = resolvedData;

  //// bad data check
  // using short circuiting here for type safety
  if (!isOfTypeWeak(data, schema.type) || (data !== '' && optionsValueList.indexOf(data) === -1)) {
    errors = reportBadData(data);
    data = undefined;
  }

  return (
    <>
      <div className="p-1">
        <OverheadLabelWithMarkdownDescr
          title={label}
          required={required || false}
          description={description}
          errors={errors}
          path={path}
        />

        <ErrorRing errors={errors}>
          <SelectStatic
            options={optionsWithDescription}
            onChange={(v: string | number | undefined) => handleChange(path, v)}
            initValue={data}
            disabled={!enabled}
            canResetToUndefined={!required}
            placeholder={isPlaceholder}
          />
        </ErrorRing>
      </div>
    </>
  );
};

export const EnumControlTester: RankedTester = rankWith(22, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(withTranslateProps(React.memo(EnumControl)), false);
