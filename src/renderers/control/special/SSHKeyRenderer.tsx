import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useState } from 'react';

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
  // Client-side validation from the input (invalid/multiple keys) is folded
  // into the same error affordance as server errors: the label's error
  // indicator plus the red ring.
  const [localError, setLocalError] = useState<string>('');

  if (!visible) return <></>;

  /// data check
  if (!isOfTypeWeak(data, 'string')) {
    errors = reportBadData(data);
    data = undefined;
  }
  ///

  // The local message is more precise than the server's, so it wins; server
  // errors only show once local validation passes.
  const displayErrors = localError || errors;

  return (
    <div className="p-1">
      <div className="flex flex-row">
        {/* min-w-0: allow the input row to shrink below its intrinsic width in
            narrow panes. */}
        <div className="grow min-w-0">
          <OverheadLabelWithMarkdownDescr
            title={label}
            required={required || false}
            description={description}
            errors={displayErrors}
          />
          {/* The error ring is drawn inside SSHKeyInput, around the input row
              only. */}
          <SSHKeyInput
            data={data as string | undefined}
            id={id}
            defaultv={schema.default as string | undefined}
            placeholder={uischema?.options?.initial as string | undefined}
            placeholderEditable={uischema?.options?.initial_editable as boolean | undefined}
            enabled={enabled}
            errors={displayErrors}
            onLocalErrorChange={setLocalError}
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
