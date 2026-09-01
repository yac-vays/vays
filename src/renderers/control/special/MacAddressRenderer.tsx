import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  deregisterDebouncedCommit,
  trackedDebounce,
  registerDebouncedCommit,
} from '../../../controller/local/EditController/debounceRegistry';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../../view/thirdparty/components/ifc/TextInput/TextInput';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

// Regular expression to validate MAC address format
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

const formatMacAddress = (value: string): string => {
  // Replace '-' with ':'
  let formatted = value.replace(/-/g, ':').toUpperCase();

  // Ensure only valid MAC characters are kept
  formatted = formatted.replace(/[^0-9A-F:]/g, '');

  return formatted;
};

export const MacAddressRenderer = (props: ControlProps) => {
  /// Data validation (derived locally — props are shared and must not be mutated)
  let storedData = props.data;
  let errors = props.errors;
  if (!isOfTypeWeak(storedData, 'string')) {
    errors = reportBadData(storedData);
    storedData = undefined;
  }

  const [mac, setMac] = useState<string>(storedData ?? '');
  const rootRef = useRef<HTMLDivElement>(null);

  // Re-sync the local state when the stored value changes externally (e.g. a
  // YAML edit projected back into the form) — but never while the user is
  // typing in this field.
  useEffect(() => {
    if (rootRef.current?.contains(document.activeElement)) return;
    setMac(typeof storedData === 'string' ? storedData : '');
  }, [storedData]);

  const update = useCallback(
    trackedDebounce((value: string) => {
      if (value === '') {
        // Explicit emptying: remove the stored value.
        props.handleChange(props.path, undefined);
        return;
      }
      // Only commit complete MAC addresses; a partial value mid-edit must not
      // delete the stored value (that is only done on blur, below).
      if (MAC_ADDRESS_REGEX.test(value)) {
        props.handleChange(props.path, value);
      }
    }, 500),
    [props.path],
  );

  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(update);
    return () => deregisterDebouncedCommit(update);
  }, [update]);

  const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;
    const formattedValue = formatMacAddress(value);
    setMac(formattedValue);
    update(formattedValue);
  };

  const onBlur = () => {
    update.flush();
    // Leaving the field with an invalid (partial) value: clear the stored value.
    if (mac !== '' && !MAC_ADDRESS_REGEX.test(mac)) {
      props.handleChange(props.path, undefined);
    }
  };

  // Local validation uses the same error affordance as server errors: the
  // label's error indicator plus the red ring (no text below the box). The
  // local message is more precise than the server's, so it wins; server
  // errors only show once local validation passes.
  const localError =
    mac.length > 0 && !MAC_ADDRESS_REGEX.test(mac) ? 'Invalid MAC address format' : '';
  const displayErrors = localError || errors;

  return (
    <div className="p-1" ref={rootRef} onBlur={onBlur}>
      <OverheadLabel
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={displayErrors}
        path={props.path}
      />
      <ErrorRing errors={displayErrors}>
        <TextInput
          enabled={props.enabled}
          defaultv={props.schema.default}
          placeholder={props.uischema.options?.initial}
          placeholderEditable={props.uischema.options?.initial_editable}
          data={mac}
          onChange={onChange}
        />
      </ErrorRing>
    </div>
  );
};

export const MacAddressRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('mac_address')),
);

export default withJsonFormsControlProps(MacAddressRenderer);
