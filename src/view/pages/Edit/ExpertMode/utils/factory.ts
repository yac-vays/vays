import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { currentSession } from '../../../../../controller/local/EditController/session';
import {
  consumeYamlSuppression,
  getCanonicalYAML,
} from '../../../../../controller/local/EditController/sync';
import getEditorSettings, { EditorUpdateCallback } from './setup';

export function getModel(update: EditorUpdateCallback): monaco.editor.ITextModel {
  let model: monaco.editor.ITextModel;

  if (monaco.editor.getModels().length != 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    model = monaco.editor.getModel(monaco.Uri.parse('inmemory://schema.json'))!;
  } else {
    model = monaco.editor.createModel('', 'yaml', monaco.Uri.parse('inmemory://schema.json'));
    model.onDidChangeContent(() => {
      // Ignore our own programmatic write (form -> YAML projection): it carries
      // the suppression flag, and re-validating it would bounce back to the form.
      if (consumeYamlSuppression()) return;
      const value = model.getValue();
      // No semantic change versus what the backend already blessed: skip the
      // round-trip (also guards initial setValue echoes).
      if (value === getCanonicalYAML()) return;
      // Stamp the keystroke with its session so the debounced commit can drop
      // it if the user navigates away before the debounce fires.
      update(value, currentSession());
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

  // Reuse the existing editor only if one is actually alive (the previous one
  // is disposed on Editor.tsx effect cleanup, which may leave the container
  // attribute behind).
  const existingEditors = monaco.editor.getEditors();
  if (
    monacoEl?.current != null &&
    (existingEditors.length === 0 ||
      monacoEl.current.attributes.getNamedItem('data-keybinding-context') == null)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ed = monaco.editor.create(monacoEl.current!, getEditorSettings(model!));
    newEditor = true;
  } else {
    ed = existingEditors[0] as monaco.editor.IStandaloneCodeEditor;
    ed.setModel(model);
  }
  return [ed, newEditor];
}
