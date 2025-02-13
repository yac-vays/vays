import { debounce, DebouncedFunc } from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml';
import { updateYAMLschema } from '../../../../../controller/local/EditController/ExpertMode';
import {
  getCurrentContext,
  getEntityName,
  getMonacoYaml,
  setEntityYAML,
} from '../../../../../controller/local/EditController/ExpertMode/access';
import { getYACValidateResponse } from '../../../../../controller/local/EditController/shared';

export function setupMonacoYAMLPlugin() {
  const defaultSchema: SchemasSettings = {
    uri: 'inmemory://schema.json',
    schema: {},
    fileMatch: ['*'],
  };

  const monacoYaml = configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    schemas: [defaultSchema],
    validate: true,
    completion: true,
  });
  return monacoYaml;
}

export default function getEditorSettings(
  model: monaco.editor.ITextModel,
): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    automaticLayout: true,
    model: model,
    theme: window.document.body.classList.contains('dark') ? 'vays-dark' : 'vays-light',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    formatOnType: false,
    fontSize: 18,
    fixedOverflowWidgets: true,
    glyphMargin: true,
    stickyScroll: {
      enabled: false, //TODO: REENABLE AFTER COLOR STUFF
    },
    lineNumbersMinChars: 0,
    padding: { top: 10 },
  };
}

export function getUpdateCallback(
  setIsValidating: (v: boolean) => void,
  setEditErrorMsg: (v: string) => void,
): DebouncedFunc<(value: string) => Promise<void>> {
  return debounce(async (value: string) => {
    const requestEditContext = getCurrentContext();
    if (requestEditContext == null) return;

    setEntityYAML(value);
    setIsValidating(true);
    const rep = await updateYAMLschema(getEntityName(), value, requestEditContext);
    setEditErrorMsg(getYACValidateResponse());
    setIsValidating(false);

    if (rep == null) return;
    await getMonacoYaml().update({
      schemas: [
        {
          uri: 'inmemory://schema.json',
          schema: rep.json_schema,
          fileMatch: ['*'],
        },
      ],
    });
  }, 1500);
}
