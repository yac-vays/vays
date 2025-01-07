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

import { isCustomRenderer } from '../../utils/customTesterUtils';
import SSHKeyInput from '../../../view/thirdparty-based-components/ifc/SSHKey/SSHKeyInput';
import OverheadLabel from '../../../view/thirdparty-based-components/ifc/Label/OverheadLabel';

export const SSHKeyRenderer = (props: ControlProps) => {
  const sshlist: string[] = (props.data ?? '').split('\n');
  return (
    <div className="p-1">
      <div className="flex flex-row">
        <div className="grow">
          <OverheadLabel
            title={props.label}
            required={props.required || false}
            description={props.description}
          />
          {sshlist.map((v: string) => (
            <SSHKeyInput
              {...props}
              data={v}
              enabled={false}
              onChange={(v: string) => props.handleChange(props.path, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SSHKeyRendererTester: RankedTester = rankWith(
  22,
  and(
    or(isStringControl, (uischema, schema, context: TesterContext) => {
      if (uischema.scope == undefined) return false;
      const subschema = resolveSchema(schema, uischema.scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('ssh_key'),
  ),
);
export default withJsonFormsControlProps(SSHKeyRenderer);
