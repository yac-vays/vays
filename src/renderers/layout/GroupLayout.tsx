/*
  This renderer was adapted from the JSON forms library.
  ----------------------------------------------------------------------------

  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import React from 'react';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
import {
  MaterialLabelableLayoutRendererProps,
  MaterialLayoutRenderer,
} from '@jsonforms/material-renderers';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import FormComponentTitle from '../../view/components/FormComponentTitle';

export const _groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

const GroupComponent = React.memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  ...props
}: MaterialLabelableLayoutRendererProps) {
  const groupLayout = uischema as GroupLayout;

  if (!visible) return null;

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
        elements={groupLayout.elements}
      />
    </div>
  );
});

export const GroupLayoutRenderer = ({
  uischema,
  schema,
  path,
  visible,
  enabled,
  renderers,
  cells,
  direction,
  label,
}: LayoutProps) => {
  const groupLayout = uischema as GroupLayout;

  return (
    <GroupComponent
      elements={groupLayout.elements}
      schema={schema}
      path={path}
      direction={direction}
      visible={visible}
      enabled={enabled}
      uischema={uischema}
      renderers={renderers}
      cells={cells}
      label={label}
    />
  );
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);

export const groupTester: RankedTester = withIncreasedRank(21, _groupTester);
