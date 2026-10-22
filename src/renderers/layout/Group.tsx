import React, { useMemo } from 'react';
import { GroupLayout } from '@jsonforms/core';
import {
  MaterialLabelableLayoutRendererProps,
  MaterialLayoutRenderer,
} from '@jsonforms/material-renderers';
import { groupIntoRows } from './RowLayout';

const GroupComponent = React.memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  ...props
}: MaterialLabelableLayoutRendererProps) {
  const elements = useMemo(() => groupIntoRows((uischema as GroupLayout).elements), [uischema]);
  if (!visible) return <></>;

  return (
    // mx-1 lines the group border up with sibling controls' boxes (p-1 wrappers).
    <div className="my-4 mx-1 border border-[#c9c9c9] rounded-sm p-2">
      {label ? (
        <>
          <h4 className="mb-0 text-2xl text-plainfont">{label}</h4>
          <div className="mb-10"></div>
        </>
      ) : (
        <></>
      )}
      <MaterialLayoutRenderer {...props} visible={true} enabled={enabled} elements={elements} />
    </div>
  );
});

export default GroupComponent;
