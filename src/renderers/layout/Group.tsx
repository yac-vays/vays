import React from 'react';
import { GroupLayout } from '@jsonforms/core';
import {
  MaterialLabelableLayoutRendererProps,
  MaterialLayoutRenderer,
} from '@jsonforms/material-renderers';

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
      {label ? (
        <>
          <h4 className="mb-0 text-2xl text-plainfont">{label}</h4>
          <div className="mb-10"></div>
        </>
      ) : (
        <></>
      )}
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
