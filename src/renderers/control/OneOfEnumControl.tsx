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
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

export const OneOfEnumControl = ({
  errors,
  required,
  description,
  data,
  label,
  options,
  handleChange,
  schema,
  path,
  uischema,
  enabled,
}: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  const optionsValueList: (string | undefined)[] = [undefined];
  if (options !== undefined) {
    options.forEach((v) => {
      optionsValueList.push(v.value);
    });
  }

  // placeholder is always editable for date (makes no difference)
  if (data == undefined) {
    data = uischema.options?.initial;
  }

  //// bad data check
  // using short circuiting here for type safety
  if (!isOfTypeWeak(data, schema.type) || optionsValueList.indexOf(data) === -1) {
    errors = reportBadData(data);
    data = undefined;
  }

  return (
    <>
      <div className="p-1 mb-4.5">
        <OverheadLabel title={label} required={required || false} description={description} />

        <SelectStatic
          options={options || []}
          onChange={(v: string) => handleChange(path, v)}
          initValue={data}
          disabled={!enabled}
        />
        <ErrorBox displayError={errors} />
      </div>
    </>
  );
};

export const OneOfEnumControlTester: RankedTester = rankWith(25, isOneOfEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(withTranslateProps(React.memo(OneOfEnumControl)), false);
