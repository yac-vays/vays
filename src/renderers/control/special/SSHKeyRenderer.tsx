import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import SSHKeyInput from '../../../view/components/SSHKeyInput';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
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
  schema,
  enabled,
}: ControlProps) => {
  if (!visible) return <></>;

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  return (
    <div className="p-1">
      <div className="flex flex-row">
        <div className="grow">
          <OverheadLabelWithMarkdownDescr
            title={label}
            required={required || false}
            description={description}
            errors={errors}
          />
          {/* The error ring is drawn inside SSHKeyInput (around the input row
              only), so it does not enclose the ErrorBox below it. */}
          <SSHKeyInput
            data={data as string | undefined}
            id={id}
            defaultv={schema.default as string | undefined}
            placeholder={uischema?.options?.initial as string | undefined}
            placeholderEditable={uischema?.options?.initial_editable as boolean | undefined}
            enabled={enabled}
            errors={errors}
            onChange={(v) => handleChange(path, v)}
          />
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
