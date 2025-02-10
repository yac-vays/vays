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
import { debounce } from 'lodash';
import { ChangeEvent, useCallback, useState } from 'react';
import { hashPassword } from '../../../utils/passwordHashes';
import TextInput from '../../../view/thirdparty/components/ifc/TextInput/TextInput';

import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer } from '../../utils/customTesterUtils';

export const PasswordRenderer = (props: ControlProps) => {
  const pt = props.uischema?.options?.save_password_as === 'plaintext';
  const [pw, setPW] = useState<string>('');

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

  const onChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;
    setPW(value);
    // value = value ? hashPassword(value) : value;
    update(value);
  };
  const data = pw;
  // props.schema.example = props.data != undefined ? '********' : 'Please Enter the Password...';
  //
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
        placeholder={props.uischema.options?.initial}
        placeholderEditable={props.uischema.options?.initial_editable}
        data={data}
        onChange={onChange}
        password
      />
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
      <ErrorBox displayError={props.errors} />
    </div>
  );
};

export const PasswordRendererTester: RankedTester = rankWith(
  22,
  and(
    or(isStringControl, (uischema, schema, context: TesterContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((uischema as any).scope == undefined) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subschema = resolveSchema(schema, (uischema as any).scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('password'),
  ),
);
export default withJsonFormsControlProps(PasswordRenderer);
