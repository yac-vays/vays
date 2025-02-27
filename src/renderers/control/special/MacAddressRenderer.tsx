import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { debounce } from 'lodash';
import { ChangeEvent, useCallback, useState } from 'react';
import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../../view/thirdparty/components/ifc/TextInput/TextInput';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

// Regular expression to validate MAC address format
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const MacAddressRenderer = (props: ControlProps) => {
  const [mac, setMac] = useState<string>(props.data ?? '');

  /// Data validation
  if (!isOfTypeWeak(props.data, 'string')) {
    props.errors = reportBadData(props.data);
    props.data = undefined;
  }

  const formatMacAddress = (value: string): string => {
    // Replace '-' with ':'
    let formatted = value.replace(/-/g, ':').toUpperCase();

    // Ensure only valid MAC characters are kept
    formatted = formatted.replace(/[^0-9A-F:]/g, '');

    return formatted;
  };

  const update = useCallback(
    debounce((value: string) => {
      const formattedValue = formatMacAddress(value);
      props.handleChange(
        props.path,
        MAC_ADDRESS_REGEX.test(formattedValue) ? formattedValue : undefined,
      );
    }, 500),
    [props.path],
  );

  const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
    let value = ev.target.value;
    const formattedValue = formatMacAddress(value);
    setMac(formattedValue);
    update(formattedValue);
  };

  return (
    <div className="p-1">
      <OverheadLabel
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
      />
      <TextInput
        enabled={props.enabled}
        defaultv={props.schema.default}
        placeholder="XX:XX:XX:XX:XX:XX"
        data={mac}
        onChange={onChange}
      />
      {!MAC_ADDRESS_REGEX.test(mac) && mac.length > 0 && (
        <em className="text-red-500">Invalid MAC address format</em>
      )}
      <ErrorBox displayError={props.errors} />
    </div>
  );
};

export const MacAddressRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('mac_address')),
);

export default withJsonFormsControlProps(MacAddressRenderer);
