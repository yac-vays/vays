import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import MarkdownRender from '../../view/components/Markdown';
import OverheadLabelWithMarkdownDescr from '../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer } from '../utils/customTesterUtils';

/**
 * Renders a field marked as "unavailable" — typically a required field whose
 * option list came out empty, in which case the backend has also made it
 * unsatisfiable (`not: {}`) so the form is invalid and Commit is blocked.
 * Instead of a broken/empty dropdown it shows an explanatory box. The message
 * comes from `vays_options.renderer_options.unavailable_msg` (markdown), kept
 * separate from the field's `description` (which is also shown in the normal,
 * populated case); it falls back to a generic note.
 */
const UnavailableControlComponent = (props: ControlProps) => {
  if (!props.visible) return <></>;

  const message =
    props.uischema?.options?.renderer_options?.unavailable_msg ||
    'No option is available for this required field.';

  return (
    <div className="mb-3">
      <OverheadLabelWithMarkdownDescr required title={props.label} />
      <div
        className="rounded border-2 px-3 py-2"
        style={{
          borderColor: 'rgb(239 68 68 / 0.55)',
          backgroundColor: 'rgb(239 68 68 / 0.08)',
        }}
      >
        <div className="font-semibold" style={{ color: 'rgb(153 27 27)' }}>
          ⚠ No option available
        </div>
        <MarkdownRender text={message} />
      </div>
    </div>
  );
};

// Specific marker match, ranked high so it always wins over type-based testers
// (the field still carries `type`, which would otherwise pick a text control).
export const UnavailableTester: RankedTester = rankWith(100, isCustomRenderer('unavailable'));

export default withJsonFormsControlProps(UnavailableControlComponent);
