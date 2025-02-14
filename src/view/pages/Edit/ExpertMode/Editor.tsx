/**
 * Note: Do not make these two imports below dynamic!
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
//@vite-ignore
import '../../../../../public/editor/monaco-editor.js';
import '../../../../workerInit';
//import 'monaco-editor/esm/vs/editor/editor.all.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { memo, useEffect, useRef, useState } from 'react';

import {
  getMonacoYaml,
  setMonacoYaml,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import Accordion from '../../../components/Accordion';
import SubLoader from '../../../thirdparty/components/SubLoader';
import editorPlugins, { editorSetupPlugins } from './EditorPlugins';
import { getUpdateCallback, setupMonacoYAMLPlugin } from './utils/setup.js';

import { startExpertModeSession } from '../../../../controller/local/EditController/ExpertMode/index.js';
import './glyph.css';
import MetaInfoPanel from './MetaInfoPanel.js';
import { getEditor, getModel } from './utils/factory.js';

export const Editor = ({
  requestEditContext,
  setEditErrorMsg,
  setIsValidating,
}: {
  requestEditContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (b: boolean) => void;
}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(true);

  const update = getUpdateCallback();

  useEffect(() => {
    startExpertModeSession(requestEditContext, setIsValidating, setEditErrorMsg);

    if (monacoEl && requestEditContext.rc.yacURL != null) {
      setIsSettingUp(true);

      let monacoYaml = getMonacoYaml();
      if (!monacoYaml) {
        monacoYaml = setupMonacoYAMLPlugin();
        setMonacoYaml(monacoYaml);
      }

      const model = getModel(update);
      for (const plugin of editorSetupPlugins) plugin();
      const [ed, newEditor] = getEditor(model, monacoEl);
      setEditor(ed);

      (async () => {
        for (const plugin of editorPlugins) {
          await plugin(ed, requestEditContext, !newEditor);
        }
      })().finally(() => {
        setIsSettingUp(false);
      });
    }
  }, [
    requestEditContext.mode === 'change' ? requestEditContext.entityName : '',
    requestEditContext.mode,
    requestEditContext.rc.entityTypeName,
    requestEditContext.rc.yacURL,
    requestEditContext.viewMode,
  ]);

  return (
    <>
      {isSettingUp ? (
        <div className="absolute w-full h-full">
          <SubLoader action="Fetching schema..." />
        </div>
      ) : (
        <></>
      )}
      <div className={`flex flex-col h-full relative grow ${isSettingUp ? 'hidden' : ''}`}>
        <Accordion title="General Settings" reduced expanded>
          <div>
            <div className="h-4"></div>
            <MetaInfoPanel
              requestEditContext={requestEditContext}
              updateCallback={() => {
                if (editor) update(editor.getValue());
              }}
            />
          </div>
        </Accordion>
        <div className="relative overflow-visible rounded grow">
          <div className="absolute h-full w-full overflow-visible" ref={monacoEl}></div>
        </div>
      </div>
    </>
  );
};

export default memo(Editor);
