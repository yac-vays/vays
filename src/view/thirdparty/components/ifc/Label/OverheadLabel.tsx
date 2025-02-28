import InformationButton from '../../../../components/Buttons/InformationButton';

interface OverheadLabelProps {
  required: boolean;
  title?: string;
  description?: string;
}

/**
 * @note Note that the description is handled as markdown string.
 * @returns
 */
const OverheadLabelWithMarkdownDescr = ({ required, title, description }: OverheadLabelProps) => {
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
    </label>
  );
};

export default OverheadLabelWithMarkdownDescr;
