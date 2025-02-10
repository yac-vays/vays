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

import SSHKeyInput from '../../../view/components/SSHKeyInput';
import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer } from '../../utils/customTesterUtils';

export const SSHKeyRenderer = (props: ControlProps) => {
  if (!props.visible) return <></>;
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
              data={v}
              id={props.id}
              placeholder={props.uischema?.options?.initial ?? 'Click to select file...'}
              enabled={false}
              onChange={(v: string) => props.handleChange(props.path, v)}
            />
          ))}
          <ErrorBox displayError={props.errors} />
        </div>
      </div>
    </div>
  );
};

export const SSHKeyRendererTester: RankedTester = rankWith(
  22,
  and(
    or(isStringControl, (uischema, schema, context: TesterContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((uischema as any).scope == undefined) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subschema = resolveSchema(schema, (uischema as any).scope, context?.rootSchema);

      return subschema.type === undefined && subschema.pattern != undefined;
    }),
    isCustomRenderer('ssh_key'),
  ),
);
export default withJsonFormsControlProps(SSHKeyRenderer);
