import { RequestEditContext } from '../../../../utils/types/internal/request';
// import Editor from ;

import { lazy, Suspense } from 'react';
import SubLoader from '../../../thirdparty-based-components/SubLoader';

const Editor = lazy(() => import('./Editor'));

const ExpertMode = ({
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
      {/* <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
      <div className="relative px-4 overflow-hidden md:px-8 flex flex-col"> */}
      {/* md:overflow-auto */}
      <Suspense
        fallback={
          <div className="absolute w-full h-full" style={{ bottom: 0 }}>
            <SubLoader action="Loading Editor" />
          </div>
        }
      >
        <Editor
          requestEditContext={requestContext}
          setEditErrorMsg={setEditErrorMsg}
          setIsValidating={setIsValidating}
        />
      </Suspense>
      {/* <div className={`absolute mx-4 md:mx-8 p-2 rounded duration-1000 opacity-0 ${isDisplayingYACError && "opacity-100"}`} 
          style={{bottom:0, left:0, right:0, backgroundColor: "rgb(255 0 200/ 0.6)"}}>
          {yacErrorMsg}
        </div> */}
      {/* </div>
    </section> */}
    </>
  );
};

export default ExpertMode;
