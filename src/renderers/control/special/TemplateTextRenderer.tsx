import { and, ControlProps, isControl, RankedTester, rankWith } from '@jsonforms/core';
import { useJsonForms, withJsonFormsControlProps } from '@jsonforms/react';
import { useState } from 'react';
import { renderTemplate } from '../../../utils/templateText';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer } from '../../utils/customTesterUtils';

/**
 * Read-only text assembled from a template and the current form data (see
 * utils/templateText for the placeholder syntax), e.g. a user name derived
 * from the entity name and fields of the current array item. Never touches
 * the field's own data.
 */
export const TemplateTextControl = (props: ControlProps) => {
  const ctx = useJsonForms();
  const [copied, setCopied] = useState(false);

  if (!props.visible) return <></>;

  const template = props.uischema?.options?.renderer_options?.template;
  const specError =
    typeof template === 'string'
      ? ''
      : "Spec error: renderer 'template_text' requires `vays_options.renderer_options.template`.";
  const parts = specError ? [] : renderTemplate(template, ctx.core?.data, props.path);
  const complete = parts.every((p) => !p.missing);
  const text = parts.map((p) => p.text).join('');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still select+copy manually
    }
  };

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label ?? props.schema.title}
        required={false}
        description={props.description}
        errors={specError}
        path={props.path}
      />
      <ErrorRing errors={specError}>
        <div className="flex flex-row gap-2 items-stretch">
          <div className="grow min-w-0 rounded-md border border-stroke px-5 py-2.5 font-mono text-sm break-all select-all dark:bg-meta-4">
            {parts.map((p, i) =>
              p.missing ? (
                <span key={i} className="italic opacity-50">
                  {p.text}
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              ),
            )}
          </div>
          {!specError && (
            <button
              type="button"
              onClick={onCopy}
              disabled={!complete}
              title={complete ? undefined : 'Fill in the missing values first'}
              className="rounded-md border border-stroke px-3 py-2 text-sm hover:bg-meta-4 hover:text-white whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </ErrorRing>
    </div>
  );
};

// Not gated on the schema type: like info_box, the field carries no data
// (`not: {}`, no type).
export const TemplateTextTester: RankedTester = rankWith(
  22,
  and(isControl, isCustomRenderer('template_text')),
);
export default withJsonFormsControlProps(TemplateTextControl);
