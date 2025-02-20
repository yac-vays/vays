import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import SSHKeyInput from '../../../view/components/SSHKeyInput';
import ErrorBox from '../../../view/thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

export const SSHKeyRenderer = ({
  visible,
  data,
  path,
  label,
  required,
  id,
  description,
  uischema,
  errors,
  handleChange,
  // schema,
  // enabled,
}: ControlProps) => {
  if (!visible) return <></>;

  if (data === undefined && uischema.options?.initial_editable && uischema?.options?.initial) {
    data = uischema.options?.initial_editable;
  }

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  const sshlist: string[] = (data ?? '').split('\n');
  return (
    <div className="p-1">
      <div className="flex flex-row">
        <div className="grow">
          <OverheadLabel title={label} required={required || false} description={description} />
          {sshlist.map((v: string) => (
            <SSHKeyInput
              data={v}
              id={id}
              placeholder={uischema?.options?.initial ?? 'Click to select file...'}
              enabled={false}
              onChange={(v: string) => handleChange(path, v)}
            />
          ))}
          <ErrorBox displayError={errors} />
        </div>
      </div>
    </div>
  );
};

export const SSHKeyRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('ssh_key')),
);
export default withJsonFormsControlProps(SSHKeyRenderer);
