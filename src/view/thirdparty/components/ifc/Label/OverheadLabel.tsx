import ErrorButton from '../../../../components/Buttons/ErrorButton';
import InformationButton from '../../../../components/Buttons/InformationButton';
import { FormFieldLimitChips } from '../../../../components/LimitChips';

interface OverheadLabelProps {
  required: boolean;
  title?: string;
  description?: string;
  /** Validation error(s) for this control; shown via a red info-button. */
  errors?: string;
  /** The control's data path; anchors matching `limits` usage chips here. */
  path?: string;
  /** Extra content after the indicators (e.g. a renderer's own live usage chip). */
  adornment?: React.ReactNode;
}

/**
 * @note Note that the description is handled as markdown string.
 * @returns
 */
const OverheadLabelWithMarkdownDescr = ({
  required,
  title,
  description,
  errors,
  path,
  adornment,
}: OverheadLabelProps) => {
  return (
    <label className="mb-2.5 block text-plainfont flex flex-row">
      <span className="pr-1 capitalize">{title}</span>
      {required ? <span className="text-danger pr-2"> *</span> : <></>}
      {description != undefined && description.length > 0 ? (
        <div className="relative">
          <InformationButton title={title} description={description} isMarkdown />
        </div>
      ) : (
        <></>
      )}
      {errors ? (
        <div className="relative ml-1">
          <ErrorButton content={errors} />
        </div>
      ) : (
        <></>
      )}
      {path != null ? (
        <span className="relative ml-1 flex items-center">
          <FormFieldLimitChips path={path} />
        </span>
      ) : (
        <></>
      )}
      {adornment != null ? (
        <span className="relative ml-1 flex items-center">{adornment}</span>
      ) : (
        <></>
      )}
    </label>
  );
};

export default OverheadLabelWithMarkdownDescr;
