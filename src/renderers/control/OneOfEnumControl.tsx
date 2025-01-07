import React from 'react';
import {
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsOneOfEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithOptionLabel } from '@jsonforms/material-renderers/lib/mui-controls';
import SelectStatic from '../../view/thirdparty-based-components/ifc/Selector/SelectStatic';

export const OneOfEnumControl = (
  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps,
) => {
  const { config, uischema, errors, required, description, data } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema.options };
  const isValid = errors.length === 0;

  return appliedUiSchemaOptions.autocomplete === false ? (
    <div className="p-1">
      <SelectStatic
        title={props.schema.title}
        options={props.options || []}
        onChange={(v: string) => props.handleChange(props.path, v)}
        initValue={data}
        required={required}
        description={description}
        errors={errors}
      />
    </div>
  ) : (
    // TODO: This DOES NOT DO AUTOCOMPLETE.
    // TODO: Allow multiple!
    <div className="p-1">
      <SelectStatic
        title={props.schema.title}
        options={props.options || []}
        onChange={(v: string) => props.handleChange(props.path, v)}
        initValue={data}
        required={true}
        description={description}
        errors={errors}
      />
    </div>
  );
};

export const OneOfEnumControlTester: RankedTester = rankWith(25, isOneOfEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(withTranslateProps(React.memo(OneOfEnumControl)), false);
