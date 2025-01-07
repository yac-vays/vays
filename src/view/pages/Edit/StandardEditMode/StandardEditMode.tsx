import { RequestEditContext } from '../../../../controller/global/URLValidation';
import Form from './Form';

const StandardEditMode = ({
  requestContext,
  setEditErrorMsg,
  setIsValidating,
}: {
  requestContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (b: boolean) => void;
}) => {
  return (
    <>
      {/* md:overflow-auto */}
      <Form
        requestEditContext={requestContext}
        onYacError={setEditErrorMsg}
        setValidationStatus={setIsValidating}
      />

      {/* <div className={`absolute mx-4 md:mx-8 p-2 rounded duration-1000 opacity-0 ${isDisplayingYACError && "opacity-100"}`} 
          style={{bottom:0, left:0, right:0, backgroundColor: "rgb(255 0 200/ 0.6)"}}>
          {yacErrorMsg}
        </div> */}
    </>
  );
};

export default StandardEditMode;
