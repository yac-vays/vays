import { isOneOfEnumControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsOneOfEnumProps, withTranslateProps } from '@jsonforms/react';
import React from 'react';
import { EnumControl } from './EnumControl';

// The rendering is identical to the plain enum control; only the props
// extraction (`oneOf` consts vs `enum` values) differs, which the HOC handles.
export { EnumControl as OneOfEnumControl };

export const OneOfEnumControlTester: RankedTester = rankWith(25, isOneOfEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(withTranslateProps(React.memo(EnumControl)), false);
