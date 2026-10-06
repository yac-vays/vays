import { and, ControlProps, isControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import FormComponentTitle from '../../../view/components/FormComponentTitle';
import MarkdownRender from '../../../view/components/Markdown';
import { isCustomRenderer } from '../../utils/customTesterUtils';

export const InfoBoxControl = (props: ControlProps) => {
  return (
    <div className="mt-4 mb-6 p-1">
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

// Not gated on the schema type: the box never touches data, and the
// documented shape (`not: {}`, no type) would otherwise match no renderer.
export const InfoBoxTester: RankedTester = rankWith(
  22,
  and(isControl, isCustomRenderer('info_box')),
);
export default withJsonFormsControlProps(InfoBoxControl);
