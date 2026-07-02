import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import MarkdownRender from '../../../view/components/Markdown';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';

export const InfoBoxControl = (props: ControlProps) => {
  return (
    <div className="mt-4 mb-6 pr-4 p-1">
      {/* Displaying the description IS this renderer's purpose, so it stays
          inline as body text (as markdown, like everywhere else) instead of
          behind the title's info-button. */}
      <FormComponentTitle label={props.schema.title} onClick={() => {}} hideAddButton />
      <div className="pl-1">
        <MarkdownRender text={props.description ?? ''} />
      </div>
    </div>
  );
};

export const InfoBoxTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('info_box')),
);
export default withJsonFormsControlProps(InfoBoxControl);
