import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';

export const InfoBoxControl = (props: ControlProps) => {
  return (
    <div className="mt-4 mb-6 pr-4 p-1">
      <FormComponentTitle
        label={props.schema.title}
        description={' '}
        onClick={() => {}}
        hideAddButton
      />
      <div className="pl-1 whitespace-pre-line">{props.description}</div>
    </div>
  );
};

export const InfoBoxTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('info_box')),
);
export default withJsonFormsControlProps(InfoBoxControl);
