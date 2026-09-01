import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { hashPassword } from '../../../utils/passwordHashes';
import TextInput from '../../../view/thirdparty/components/ifc/TextInput/TextInput';

import {
  deregisterDebouncedCommit,
  trackedDebounce,
  registerDebouncedCommit,
} from '../../../controller/local/EditController/debounceRegistry';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

export const PasswordRenderer = (props: ControlProps) => {
  const pt = props.uischema?.options?.renderer_options?.save_password_as === 'plaintext';
  const [pw, setPW] = useState<string>('');

  /// data check (derived locally — props/uischema are shared and must not be mutated)
  let storedData = props.data;
  let errors = props.errors;
  if (!isOfTypeWeak(storedData, 'string')) {
    errors = reportBadData(storedData);
    storedData = undefined;
  }
  ///

  // When a value is stored, show a masked placeholder instead of the
  // uischema-provided initial value.
  let placeholder = props.uischema.options?.initial;
  let placeholderEditable = props.uischema.options?.initial_editable;
  if (storedData) {
    placeholder = pt ? '*'.repeat(storedData.length) : '*'.repeat(10);
    placeholderEditable = false;
  }

  const update = useCallback(
    trackedDebounce(
      (value: string) =>
        props.handleChange(props.path, value ? (pt ? value : hashPassword(value)) : undefined),
      1500,
    ),
    [props.path],
  );

  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(update);
    return () => deregisterDebouncedCommit(update);
  }, [update]);

  const onChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;
    setPW(value);
    // value = value ? hashPassword(value) : value;
    update(value);
  };
  const data = pw;
  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={errors}
        path={props.path}
      />
      <ErrorRing errors={errors}>
        <TextInput
          enabled={props.enabled}
          defaultv={props.schema.default}
          placeholder={placeholder}
          placeholderEditable={placeholderEditable}
          data={data}
          onChange={onChange}
          password
        />
      </ErrorRing>
      {props.uischema?.options?.renderer_options?.save_password_as === 'plaintext' ? (
        <></>
      ) : (
        <em className="opacity-60">
          This password is transmitted as SHA-512 UNIX crypt-hash.{' '}
          <a href="https://www.akkadia.org/drepper/SHA-crypt.txt" style={{ color: 'blue' }}>
            More info
          </a>
        </em>
      )}
    </div>
  );
};

export const PasswordRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('password')),
);
export default withJsonFormsControlProps(PasswordRenderer);
