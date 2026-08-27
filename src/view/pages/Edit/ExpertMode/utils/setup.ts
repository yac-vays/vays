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
import { patchSchemaForMonaco } from '../../../../../utils/schema/monacoSchemaFix';
import { setBackendValidationMarkers } from '../EditorPlugins/backendMarkers';
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

// Home for Monaco's overflowing widgets (hover, suggest, ...), appended to
// <body> so they escape the pane's `isolate` stacking context — otherwise the
// frame's dim overlay (z-10) paints over the part of a popup that overlaps the
// pane while the part sticking out past it stays uncovered. The `monaco-editor`
// class is required for the (globally injected) editor/theme CSS to style them.
let overflowWidgetsDomNode: HTMLDivElement | null = null;

function getOverflowWidgetsDomNode(): HTMLDivElement {
  if (overflowWidgetsDomNode == null) {
    overflowWidgetsDomNode = document.createElement('div');
    overflowWidgetsDomNode.className = 'monaco-editor';
    overflowWidgetsDomNode.style.position = 'fixed';
    overflowWidgetsDomNode.style.top = '0';
    overflowWidgetsDomNode.style.left = '0';
    overflowWidgetsDomNode.style.zIndex = '60';
    document.body.appendChild(overflowWidgetsDomNode);
  }
  return overflowWidgetsDomNode;
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
    overflowWidgetsDomNode: getOverflowWidgetsDomNode(),
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
            schema: patchSchemaForMonaco(rep.json_schema),
            fileMatch: ['*'],
          },
        ],
      });
      // Backend-only findings (custom formats, ...) as markers on the text
      // the user just typed.
      setBackendValidationMarkers(
        monaco.editor.getModel(monaco.Uri.parse('inmemory://schema.json')),
        rep,
      );
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
