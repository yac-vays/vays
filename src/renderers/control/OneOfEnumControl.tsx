import {
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { WithOptionLabel } from '@jsonforms/material-renderers/lib/mui-controls';
import { TranslateProps, withJsonFormsOneOfEnumProps, withTranslateProps } from '@jsonforms/react';
import React from 'react';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import SelectStatic from '../../view/thirdparty/components/ifc/Selector/SelectStatic';

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
