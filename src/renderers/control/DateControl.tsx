import merge from 'lodash/merge';
import { ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import DatePicker from '../../view/thirdparty-based-components/ifc/Datepicker/DatePicker';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';
import { hashCode } from '../../utils/hashUtils';
import OverheadLabel from '../../view/thirdparty-based-components/ifc/Label/OverheadLabel';

export const DateControl = (props: ControlProps) => {
  const {
    description,
    errors,
    label,
    schema,
    uischema,
    visible,
    enabled,
    required,
    path,
    handleChange,
    data,
    config,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const format = appliedUiSchemaOptions.dateFormat;
  //const saveFormat = appliedUiSchemaOptions.dateSaveFormat ?? defaultDateFormat;

  if (!visible) {
    return null;
  }

  return (
    <div className="p-1">
      <OverheadLabel title={label} required={required || false} description={description} />

      <DatePicker
        id={hashCode(path).toString()}
        onChange={(v: string) => {
          handleChange(path, v);
        }}
        format={format}
        data={data}
        type={schema.format ?? 'date'}
        enabled={enabled}
      />
      <ErrorBox displayError={errors} />
    </div>
  );
};

export const DateControlTester: RankedTester = rankWith(24, isDateControl);

export default withJsonFormsControlProps(DateControl);
