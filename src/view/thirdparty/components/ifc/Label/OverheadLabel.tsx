import ErrorButton from '../../../../components/Buttons/ErrorButton';
import InformationButton from '../../../../components/Buttons/InformationButton';

interface OverheadLabelProps {
  required: boolean;
  title?: string;
  description?: string;
  /** Validation error(s) for this control; shown via a red info-button. */
  errors?: string;
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
    </label>
  );
};

export default OverheadLabelWithMarkdownDescr;
