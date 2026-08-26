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
    // mx-1 lines the group border up with sibling controls' boxes (p-1 wrappers).
    <div className="my-4 mx-1 border border-[#c9c9c9] rounded p-2">
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
