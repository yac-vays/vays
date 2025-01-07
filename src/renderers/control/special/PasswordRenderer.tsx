import { ChangeEvent, useCallback, useState } from 'react';
import {
  and,
  ControlProps,
  isStringControl,
  or,
  RankedTester,
  rankWith,
  resolveSchema,
  TesterContext,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useDebouncedChange } from '@jsonforms/material-renderers';
import TextInput from '../../../view/thirdparty-based-components/ifc/TextInput/TextInput';
import { debounce } from 'lodash';
import { hashPassword } from '../../../utils/userInputUtils/passwordHashes';

const eventToValue = (ev: ChangeEvent<HTMLInputElement>) =>
  ev.target.value === '' ? undefined : ev.target.value;
import { isCustomRenderer } from '../../utils/customTesterUtils';

export const PasswordRenderer = (props: ControlProps) => {
  const pt = props.uischema?.options?.save_password_as === 'plaintext';
  const [pw, setPW] = useState<string>('');
  ''.length;

  if (!props.uischema.options) {
    props.uischema.options = {};
  }
  if (props.data) {
    props.uischema.options.initial = pt ? '*'.repeat(props.data.length) : '*'.repeat(10);
    props.uischema.options.initial_editable = false;
  }

  const update = useCallback(
    debounce(
      (value: string) =>
        props.handleChange(props.path, value ? (pt ? value : hashPassword(value)) : undefined),
      1500,
    ),
    [props.path],
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, __, onClear] = useDebouncedChange(
    () => {},
    '',
    props.data,
    props.path,
    eventToValue,
    0,
  );
  const onChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    let value = ev.target.value;
    setPW(value);
    // value = value ? hashPassword(value) : value;
    update(value);
  };
  const data = pw;
  // props.schema.example = props.data != undefined ? '********' : 'Please Enter the Password...';
  //
  return (
    <div className="p-1">
      <TextInput {...props} data={data} onChange={onChange} onClear={onClear} password />
      {props.uischema?.options?.save_password_as === 'plaintext' ? (
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
  and(
    or(isStringControl, (uischema, schema, context: TesterContext) => {
      if (uischema.scope == undefined) return false;
      const subschema = resolveSchema(schema, uischema.scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('password'),
  ),
);
export default withJsonFormsControlProps(PasswordRenderer);
