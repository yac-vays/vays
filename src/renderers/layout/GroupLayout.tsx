import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import GroupComponent from './Group';

export const GroupLayoutRenderer = ({ uischema, ...props }: LayoutProps) => {
  return (
    <GroupComponent elements={(uischema as GroupLayout).elements} uischema={uischema} {...props} />
  );
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);

export const groupTester: RankedTester = rankWith(21, uiTypeIs('Group'));
