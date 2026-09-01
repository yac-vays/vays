import { ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { isRFC3339Date } from '../../utils/dateUtils';
import { hashCode } from '../../utils/hashUtils';
import ErrorRing from '../../view/components/Form/ErrorRing';
import DatePicker from '../../view/thirdparty/components/ifc/Datepicker/DatePicker';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isOfTypeWeak, reportBadData } from '../utils/dataSanitization';
import { resolveInitial } from '../utils/initialHandling';

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
  const ropts = uischema.options?.renderer_options ?? {};
  const enableRange = ropts.enable_range;
  const disableRange = ropts.disable_range;

  const format = appliedUiSchemaOptions.dateFormat;
  //const saveFormat = appliedUiSchemaOptions.dateSaveFormat ?? defaultDateFormat;

  if (!visible) {
    return null;
  }

  // `initial` is shown but is not data yet; with `initial_editable: false`
  // (the default) the pre-filled date is greyed out until the user picks one.
  const { data: resolvedData, isPlaceholder } = resolveInitial<string>(data, uischema);
  data = resolvedData;

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
        errors={errors}
        path={path}
      />

      <ErrorRing errors={errors}>
        {/* Placeholder look via inherited text color + reduced opacity: the
            flatpickr alt input is created once at init, so a class on the
            input itself would not update afterwards. */}
        <div className={isPlaceholder ? 'text-reducedfont opacity-60' : ''}>
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
        </div>
      </ErrorRing>
    </div>
  );
};

export const DateControlTester: RankedTester = rankWith(24, isDateControl);

export default withJsonFormsControlProps(DateControl);
