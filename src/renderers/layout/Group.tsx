import React from 'react';
import { GroupLayout } from '@jsonforms/core';
import {
  MaterialLabelableLayoutRendererProps,
  MaterialLayoutRenderer,
} from '@jsonforms/material-renderers';
import FormComponentTitle from '../../view/components/FormComponentTitle';

const GroupComponent = React.memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  ...props
}: MaterialLabelableLayoutRendererProps) {
  if (!visible) return <></>;

  return (
    <div className="mt-4 mb-4 mr-4 border border-[#c9c9c9] rounded p-2">
      {/* {!isEmpty(label) && ( */}
      <FormComponentTitle
        hideAddButton
        large
        label={label}
        onClick={() => {}}
        description={uischema?.options?.description ?? ''}
      />
      {label ? <div className="mb-10"></div> : <></>}
      <MaterialLayoutRenderer
        {...props}
        visible={true}
        enabled={enabled}
        elements={(uischema as GroupLayout).elements}
      />
    </div>
  );
});

export default GroupComponent;
