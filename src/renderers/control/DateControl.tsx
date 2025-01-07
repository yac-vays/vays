import merge from 'lodash/merge';
import { ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import DatePicker from '../../view/thirdparty-based-components/ifc/Datepicker/DatePicker';
import ErrorBox from '../../view/thirdparty-based-components/ifc/Label/ErrorBox';

export const DateControl = (props: ControlProps) => {
  const {
    description,
    id,
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
    // <LocalizationProvider dateAdapter={AdapterDayjs}>
    <div className="p-1">
      <DatePicker
        onChange={(v: string) => handleChange(path, v)}
        title={label}
        format={format}
        type={schema.format ?? 'date'}
        enabled={enabled}
        required={required}
        description={description}
      />
      <ErrorBox displayError={errors} />
    </div>
    // </LocalizationProvider>
  );
};

export const DateControlTester: RankedTester = rankWith(24, isDateControl);

export default withJsonFormsControlProps(DateControl);
