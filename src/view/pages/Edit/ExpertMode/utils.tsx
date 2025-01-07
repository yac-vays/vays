import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml';

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
