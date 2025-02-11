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

import { debounce } from 'lodash';
import { memo, useEffect, useRef, useState } from 'react';

import {
  getCurrentContext,
  getEntityName,
  getMonacoYaml,
  setCurrentContext,
  setEntityName,
  setEntityYAML,
  setMonacoYaml,
} from '../../../../controller/local/EditController/ExpertMode/access.js';
import { RequestEditContext } from '../../../../utils/types/internal/request.js';
import Accordion from '../../../components/Accordion.js';
import TextInput from '../../../thirdparty/components/ifc/TextInput/TextInput.js';
import SubLoader from '../../../thirdparty/components/SubLoader/index.js';
import editorPlugins, { editorSetupPlugins } from './EditorPlugins';
import { registerInputCallback } from './EditorPlugins/SchemaHandler';
import getEditorSettings, { setupMonacoYAMLPlugin } from './utils';

import { updateYAMLschema } from '../../../../controller/local/EditController/ExpertMode/index.js';
import {
  clearYACStatus,
  editViewNavigateToNewName,
  getYACValidateResponse,
} from '../../../../controller/local/EditController/shared';
import ErrorBox from '../../../thirdparty/components/ifc/Label/ErrorBox.js';
import OverheadLabel from '../../../thirdparty/components/ifc/Label/OverheadLabel.js';
import './glyph.css';

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

  // TODO: Probably move this over to the editor state?
  // (window as any).setEditErrorMsg = setEditErrorMsg;
  // (window as any).setIsValidating = setIsValidating;

  async function handleChange(value: string) {
    const requestEditContext = getCurrentContext();
    if (requestEditContext == null) return;

    setEntityYAML(value);
    setIsValidating(true);
    const rep = await updateYAMLschema(getEntityName(), value, requestEditContext);
    setEditErrorMsg(getYACValidateResponse());
    setIsValidating(false);

    if (rep == null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (window as any).monacoYaml.update({
      schemas: [
        {
          uri: 'inmemory://schema.json',
          schema: rep.json_schema,
          fileMatch: ['*'],
        },
      ],
    });
  }
  const update = debounce((value: string) => {
    handleChange(value);
  }, 1500);

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

      let model = null;

      if (monaco.editor.getModels().length != 0) {
        model = monaco.editor.getModel(monaco.Uri.parse('inmemory://schema.json'));
      } else {
        model = monaco.editor.createModel('', 'yaml', monaco.Uri.parse('inmemory://schema.json'));
        registerInputCallback(model, handleChange);
      }

      for (const plugin of editorSetupPlugins) plugin();

      let ed: monaco.editor.IStandaloneCodeEditor | null = null;
      let newEditor: boolean = false;

      if (
        monacoEl?.current != null &&
        monacoEl.current.attributes.getNamedItem('data-keybinding-context') == null
      ) {
        //editors.length == 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ed = monaco.editor.create(monacoEl.current!, getEditorSettings(model!));
        newEditor = true;
      } else {
        ed = monaco.editor.getEditors()[0] as monaco.editor.IStandaloneCodeEditor;
        ed.setModel(model);
      }

      setEditor(ed);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).monacoYaml = monacoYaml;

      (async () => {
        for (const plugin of editorPlugins) {
          await plugin(ed, requestEditContext, !newEditor);
        }
      })().finally(() => {
        setIsSettingUp(false);
      });

      //return ed;
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
