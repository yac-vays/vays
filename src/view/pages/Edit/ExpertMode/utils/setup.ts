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
import {
  registerDebouncedCommit,
  trackedDebounce,
  TrackedDebounced,
} from '../../../../../controller/local/EditController/debounceRegistry';
import {
  beginValidationDispatch,
  endValidationDispatch,
  isStaleSession,
} from '../../../../../controller/local/EditController/session';
import {
  getYACValidateResponse,
  setEditDirty,
} from '../../../../../controller/local/EditController/shared';
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

// One debounced editor-commit for the whole app: the (singleton) Monaco model
// binds it once (factory.ts), the save path flushes it via the registry, and
// the editor's unmount cleanup cancels a pending invocation.
export type EditorUpdateCallback = TrackedDebounced<
  (value: string, epoch: number) => Promise<void>
>;
let updateCallbackSingleton: EditorUpdateCallback | null = null;

export function getUpdateCallback(): EditorUpdateCallback {
  if (updateCallbackSingleton != null) return updateCallbackSingleton;

  updateCallbackSingleton = trackedDebounce(async (value: string, epoch: number) => {
    // `epoch` was captured when the KEYSTROKE happened. If the session moved on
    // while the text sat in the debounce window (navigation to another entity),
    // this text belongs to the previous document and must not become the new
    // session's payload — nor be validated under the new context.
    if (isStaleSession(epoch)) return;
    const requestEditContext = getCurrentContext();
    if (requestEditContext == null) return;

    // The YAML editor is the active pane while the user types in it, and the
    // session is now dirty (genuine edit — suppressed/no-op writes are filtered
    // out before `update` is called, see factory.ts).
    setActivePane('yaml');
    setEditDirty();
    setEntityYAML(value);
    setIsValidating(true);
    const seq = nextValidationSeq();
    beginValidationDispatch();
    try {
      const rep = await updateYAMLschema(
        getEntityName(),
        value,
        requestEditContext,
        getActivatedActions(),
        seq,
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
    } finally {
      endValidationDispatch();
    }
  }, 1500);

  // The save path's flush must include the editor's pending keystrokes, not
  // just the form renderers' (a commit within the debounce window would
  // otherwise silently save text older than what the editor shows).
  registerDebouncedCommit(updateCallbackSingleton);

  return updateCallbackSingleton;
}
