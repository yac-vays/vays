import InformationButton from '../../../components/Buttons/InformationButton';

interface OverheadLabelProps {
  required: boolean;
  title?: string;
  description?: string;
}

const OverheadLabel = ({ required, title, description }: OverheadLabelProps) => {
  return (
    <label className="mb-2.5 block text-black dark:text-white flex flex-row">
      <span className="pr-1 capitalize">{title}</span>
      {required ? <span className="text-meta-1 pr-2"> *</span> : <></>}
      {description != undefined ? (
        <div className="relative">
          <InformationButton title={title} description={description} />
        </div>
      ) : (
        <></>
      )}
    </label>
  );
};

export default OverheadLabel;
