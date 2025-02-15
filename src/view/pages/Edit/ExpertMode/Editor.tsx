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
  setCurrentContext,
  setEntityName,
  setMonacoYaml,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import Accordion from '../../../components/Accordion';
import TextInput from '../../../thirdparty/components/ifc/TextInput/TextInput';
import SubLoader from '../../../thirdparty/components/SubLoader';
import editorPlugins, { editorSetupPlugins } from './EditorPlugins';
import { getUpdateCallback, setupMonacoYAMLPlugin } from './utils/setup.js';

import {
  clearYACStatus,
  editViewNavigateToNewName,
} from '../../../../controller/local/EditController/shared';
import ErrorBox from '../../../thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../thirdparty/components/ifc/Label/OverheadLabel';
import './glyph.css';
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
  const [nameError, setNameError] = useState<string>('');
  const monacoEl = useRef<HTMLDivElement>(null);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(true);

  const update = getUpdateCallback(setIsValidating, setEditErrorMsg);

  useEffect(() => {
    setCurrentContext(requestEditContext);
    clearYACStatus();
    if (requestEditContext.mode == 'modify') setEntityName(requestEditContext.entityName ?? null);
    else setEntityName(null);

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
    requestEditContext.mode === 'modify' ? requestEditContext.entityName : '',
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
            <div className="flex flex-row items-end gap-4">
              <div className="grow">
                <OverheadLabel title="Entity Name" required={true} description="" />
                <TextInput
                  placeholder={requestEditContext.rc.accessedEntityType?.example ?? 'Enter name...'}
                  data={requestEditContext.entityName}
                  enabled
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const name = e.target.value === '' ? null : e.target.value;
                    if (name == null) return;
                    setEntityName(name);
                    editViewNavigateToNewName(name, requestEditContext);
                    try {
                      if (
                        !RegExp(
                          requestEditContext.rc.accessedEntityType?.name_pattern ?? '.*',
                        ).test(name)
                      ) {
                        setNameError(
                          'Does not match pattern ' +
                            requestEditContext.rc.accessedEntityType?.name_pattern,
                        );
                        return;
                      } else setNameError('');
                    } catch {
                      return;
                    }
                    if (editor) update(editor.getValue());
                  }}
                />
                <ErrorBox displayError={nameError} />
              </div>
              {/* <div className="pb-1.5">
                <Checkbox initValue={false} onChange={() => {}} title="Install" />
              </div>
               */}
            </div>
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
