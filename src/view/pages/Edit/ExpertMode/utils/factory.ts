import { DebouncedFunc } from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import getEditorSettings from './setup';

export function getModel(
  update: DebouncedFunc<(value: string) => Promise<void>>,
): monaco.editor.ITextModel {
  let model: monaco.editor.ITextModel;

  if (monaco.editor.getModels().length != 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    model = monaco.editor.getModel(monaco.Uri.parse('inmemory://schema.json'))!;
  } else {
    model = monaco.editor.createModel('', 'yaml', monaco.Uri.parse('inmemory://schema.json'));
    model.onDidChangeContent(() => {
      update(model.getValue());
    });
  }
  return model;
}

export function getEditor(
  model: monaco.editor.ITextModel,
  monacoEl: React.RefObject<HTMLDivElement>,
): [monaco.editor.IStandaloneCodeEditor, boolean] {
  let ed: monaco.editor.IStandaloneCodeEditor;
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
  return [ed, newEditor];
}
