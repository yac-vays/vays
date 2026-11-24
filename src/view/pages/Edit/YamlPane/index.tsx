import { RequestEditContext } from '../../../../utils/types/internal/request';

import { lazy, Suspense } from 'react';

const Editor = lazy(() => import('./Editor'));

const YamlPane = ({
  requestContext,
  setEditErrorMsg,
  setLoading,
  setFocused,
  visible = true,
}: {
  requestContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setLoading: (b: boolean) => void;
  setFocused: (b: boolean) => void;
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
          setLoading={setLoading}
          setFocused={setFocused}
          visible={visible}
        />
      </Suspense>
    </>
  );
};

export default YamlPane;
