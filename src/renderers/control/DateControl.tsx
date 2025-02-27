import { ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { isRFC3339Date } from '../../utils/dateUtils';
import { hashCode } from '../../utils/hashUtils';
import DatePicker from '../../view/thirdparty/components/ifc/Datepicker/DatePicker';
import ErrorBox from '../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';

export const DateControl = ({
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
}: ControlProps) => {
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const enableRange = uischema.options?.enable_range;
  const disableRange = uischema.options?.disable_range;

  const format = appliedUiSchemaOptions.dateFormat;
  //const saveFormat = appliedUiSchemaOptions.dateSaveFormat ?? defaultDateFormat;

  if (!visible) {
    return null;
  }

  // placeholder is always editable for date (makes no difference)
  if (data == undefined) {
    data = uischema.options?.initial;
  }

  //// data check
  if (!isOfTypeWeak(data, 'string') || (data != undefined && !isRFC3339Date(data))) {
    errors = reportBadData(data);
    data = undefined;
  }
  //// end data check

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={label}
        required={required || false}
        description={description}
      />

      <DatePicker
        id={hashCode(path).toString()}
        onChange={(v: string) => {
          handleChange(path, v);
        }}
        format={format}
        data={data}
        type={schema.format ?? 'date'}
        enabled={enabled}
        enableRange={enableRange}
        disableRange={disableRange}
      />
      <ErrorBox displayError={errors} />
    </div>
  );
};

export const DateControlTester: RankedTester = rankWith(24, isDateControl);

export default withJsonFormsControlProps(DateControl);
