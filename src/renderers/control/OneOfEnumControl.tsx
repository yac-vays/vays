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
import OverheadLabel from '../../view/thirdparty-based-components/ifc/Label/OverheadLabel';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';

export const OneOfEnumControl = (
  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps,
) => {
  const { errors, required, description, data } = props;

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
          initValue={data}
        />
        <ErrorBox displayError={errors} />
      </div>
    </>
  );
};

export const OneOfEnumControlTester: RankedTester = rankWith(25, isOneOfEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(withTranslateProps(React.memo(OneOfEnumControl)), false);
