import React from 'react';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
// import merge from 'lodash/merge';
import SelectStatic from '../../view/thirdparty-based-components/ifc/Selector/SelectStatic';
import { WithOptionLabel } from '@jsonforms/material-renderers';
import OverheadLabel from '../../view/thirdparty-based-components/ifc/Label/OverheadLabel';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';

export const EnumControl = (
  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps,
) => {
  const { errors, required, description } = props;
  // const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const optionsList: string[] = [];
  if (props.options !== undefined) {
    props.options.forEach((v) => optionsList.push(v.label));
  }

  return (
    <>
      <div className="p-1 mb-4.5">
        <OverheadLabel
          title={props.schema.title}
          required={required || false}
          description={description}
        />

        <SelectStatic
          options={props.options || []}
          onChange={(v: string) => props.handleChange(props.path, v)}
          initValue={props.data}
        />
        <ErrorBox displayError={errors} />
      </div>
    </>
  );
};

export const EnumControlTester: RankedTester = rankWith(22, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(withTranslateProps(React.memo(EnumControl)), false);
