import React from 'react';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
// import { MuiSelect } from '../mui-controls/MuiSelect';
import merge from 'lodash/merge';
// import { MaterialInputControl } from './MaterialInputControl';
// import {
//   MuiAutocomplete,
//   WithOptionLabel,
// } from '../mui-controls/MuiAutocomplete';
import SelectStatic from '../../view/thirdparty-based-components/ifc/Selector/SelectStatic';
import { WithOptionLabel } from '@jsonforms/material-renderers';

export const EnumControl = (
  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps,
) => {
  const { config, uischema, errors, data, required, description, label } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;
  let optionsList: string[] = [];
  if (props.options !== undefined) {
    props.options.forEach((v) => optionsList.push(v.label));
  }

  return appliedUiSchemaOptions.autocomplete === false ? (
    // <MaterialInputControl {...props} input={MuiSelect} />
    <div></div>
  ) : (
    <div className="p-1">
      <SelectStatic
        title={props.schema.title}
        options={props.options || []}
        onChange={(v: string) => props.handleChange(props.path, v)}
        initValue={props.data}
        required={required}
        description={description}
        errors={errors}
      />
      {/* <SelectStatic title={props.schema.title} options={props.options || []}
            onChange={(v: string) => props.handleChange(props.path, v)} initValue={props.data}/> */}
    </div>
    // <MuiAutocomplete {...props} isValid={isValid} />
  );
};

export const EnumControlTester: RankedTester = rankWith(22, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(withTranslateProps(React.memo(EnumControl)), false);
