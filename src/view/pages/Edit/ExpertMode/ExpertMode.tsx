import { RequestEditContext } from '../../../../utils/types/internal/request';

import { lazy, Suspense } from 'react';

const Editor = lazy(() => import('./Editor'));

const ExpertMode = ({
  requestContext,
  setEditErrorMsg,
  setIsValidating,
  setLoading,
  visible = true,
}: {
  requestContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (b: boolean) => void;
  setLoading: (b: boolean) => void;
  visible?: boolean;
}) => {
  return (
    <>
      {/* While the lazy Editor chunk loads, the frame's single loader is shown
          (the YAML pane reports `loading=true` until the editor is set up). */}
      <Suspense fallback={<></>}>
        <Editor
          requestEditContext={requestContext}
          setEditErrorMsg={setEditErrorMsg}
          setIsValidating={setIsValidating}
          setLoading={setLoading}
          visible={visible}
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
