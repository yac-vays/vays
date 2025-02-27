import flatpickr from 'flatpickr';
import { useEffect } from 'react';
import { DateRange } from '../../../../../utils/types/internal/date';

//import Language from "flatpickr/dist/l10n/de.js";

interface DatePickerProps {
  onChange: (v: string) => void;
  id: string;
  format?: string;
  type?: string;
  enabled?: boolean;
  data?: string;
  enableRange?: DateRange;
  disableRange?: DateRange;
}

/**
 * DatePicker component that renders a date picker input field using the flatpickr library.
 * Note that the date tme format can be customized according to
 * https://flatpickr.js.org/formatting/.
 *
 * Currently only handles date, not time or datetime.
 *
 * @param {Object} props - The properties object.
 * @param {function} props.onChange - Callback function to handle date change.
 * @param {string} [props.format] - The date format to display to the user. Defaults to 'D M j, Y' if not provided.
 * @param {boolean} props.enabled - Boolean indicating if the date picker is enabled or disabled.
 * @param {string} props.data - The default date to be displayed in the date picker.
 * @param {string} props.id - Unique identifier for the date picker instance.
 *
 * @returns {JSX.Element} The rendered DatePicker component.
 *
 */
const DatePicker = ({
  onChange,
  format,
  //type,
  enabled,
  data,
  id,
  enableRange,
  disableRange,
}: DatePickerProps): JSX.Element => {
  const altFmt = format == undefined || format === '' ? 'D M j, Y' : format;

  useEffect(() => {
    // Init flatpickr
    flatpickr(`.form-datepicker-${id}`, {
      defaultDate: data,
      allowInvalidPreload: true,
      mode: 'single',
      //locale: Language.de,
      static: true,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d', // What the component returns
      altInput: true,
      altFormat: altFmt, // What the user sees
      enable: enableRange ? [enableRange] : [() => true],
      disable: disableRange ? [disableRange] : [],
      prevArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });
  }, [enableRange, disableRange]);

  return (
    <>
      <div className={`${enabled ? 'opacity-100' : 'opacity-50'}`}>
        <div className="relative">
          <input
            disabled={!enabled}
            className={`form-datepicker-${id} w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary`}
            placeholder="Select date..."
            data-class="flatpickr-right"
            onInput={(e) => onChange(e.currentTarget.value)}
          />

          <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="22px"
              viewBox="0 -960 960 960"
              width="22px"
              fill="#64748B"
            >
              <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatePicker;
