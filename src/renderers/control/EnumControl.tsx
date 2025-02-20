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
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import SelectStatic from '../../view/thirdparty/components/ifc/Selector/SelectStatic';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

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

  // placeholder is always editable for enums (makes no difference)
  if (data == undefined) {
    data = uischema.options?.initial;
  }

  //// bad data check
  // using short circuiting here for type safety
  if (!isOfTypeWeak(data, schema.type) || (data !== '' && optionsValueList.indexOf(data) === -1)) {
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

export const EnumControlTester: RankedTester = rankWith(22, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(withTranslateProps(React.memo(EnumControl)), false);
