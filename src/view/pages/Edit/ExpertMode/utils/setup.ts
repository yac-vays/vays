import { debounce, DebouncedFunc } from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml';
import { updateYAMLschema } from '../../../../../controller/local/EditController/ExpertMode';
import {
  getActivatedActions,
  getCurrentContext,
  getEntityName,
  getMonacoYaml,
  setEntityYAML,
  setErrorMessage,
  setIsValidating,
} from '../../../../../controller/local/EditController/ExpertMode/access';
import { getYACValidateResponse } from '../../../../../controller/local/EditController/shared';
import {
  applyCanonical,
  isStaleValidation,
  nextValidationSeq,
  setActivePane,
} from '../../../../../controller/local/EditController/sync';

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
    // No code minimap / side overview pane — the documents are short and the
    // side-by-side layout is tight on width.
    minimap: { enabled: false },
    stickyScroll: {
      enabled: false, //TODO: REENABLE AFTER COLOR STUFF
    },
    lineNumbersMinChars: 0,
    padding: { top: 10 },
  };
}

export function getUpdateCallback(): DebouncedFunc<(value: string) => Promise<void>> {
  return debounce(async (value: string) => {
    const requestEditContext = getCurrentContext();
    if (requestEditContext == null) return;

    // The YAML editor is the active pane while the user types in it.
    setActivePane('yaml');
    setEntityYAML(value);
    setIsValidating(true);
    const seq = nextValidationSeq();
    const rep = await updateYAMLschema(
      getEntityName(),
      value,
      requestEditContext,
      getActivatedActions(),
    );
    // A newer edit (in either pane) has since been dispatched; drop this stale
    // response so it cannot overwrite the latest state.
    if (isStaleValidation(seq)) return;
    setErrorMessage(getYACValidateResponse());
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
    // Project the canonical data into the (inactive) form pane.
    applyCanonical('yaml', rep);
  }, 1500);
}
