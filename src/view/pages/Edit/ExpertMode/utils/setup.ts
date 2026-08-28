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
import { footerErrorMessage } from '../../../../../utils/schema/locatedErrors';
import { patchSchemaForMonaco } from '../../../../../utils/schema/monacoSchemaFix';
import { setBackendValidationMarkers } from '../EditorPlugins/backendMarkers';
import {
  applyCanonical,
  isStaleValidation,
  nextValidationSeq,
  setActivePane,
} from '../../../../../controller/local/EditController/sync';

/**
 * monaco-editor 0.53+ changed `editor.createWebWorker` (as exposed by the
 * curated editor.api entry we use) to a new low-level signature that takes the
 * Worker itself (`{worker, host, keepIdleModels}`). The old plugin-facing
 * signature (`{moduleId, label, createData}`) — which monaco-worker-manager,
 * monaco-yaml's worker glue, still calls — only survives as a compat shim in
 * the full-package entry (esm/vs/internal/common/workers.js), and importing
 * THAT drags in every editor feature and language, defeating monacoSetup's
 * curated bundle. So replicate the shim: create the worker via our
 * MonacoEnvironment, replay monaco's two-message handshake ('ignore' arms the
 * worker-side initialize; the second message delivers createData), and wrap it
 * in the new-style createWebWorker. Without this the yaml worker never starts
 * and ALL monaco-yaml features (diagnostics/markers, hover, completion) fail
 * silently — see https://github.com/remcohaszing/monaco-yaml/issues/272.
 */
function createWebWorkerCompat<T extends object>(opts: {
  moduleId: string;
  label?: string;
  createData?: unknown;
  host?: monaco.editor.IInternalWebWorkerOptions['host'];
  keepIdleModels?: boolean;
}): monaco.editor.MonacoWebWorker<T> {
  const env = window.MonacoEnvironment;
  if (env == null) throw new Error('MonacoEnvironment is not configured');
  const worker = Promise.resolve(
    env.getWorker('workerMain.js', opts.label ?? 'monaco-editor-worker'),
  ).then((w) => {
    w.postMessage('ignore');
    w.postMessage(opts.createData);
    return w;
  });
  return monaco.editor.createWebWorker<T>({
    worker,
    host: opts.host,
    keepIdleModels: opts.keepIdleModels,
  });
}

export function setupMonacoYAMLPlugin() {
  const defaultSchema: SchemasSettings = {
    uri: 'inmemory://schema.json',
    schema: {},
    fileMatch: ['*'],
  };

  // Hand monaco-yaml a monaco namespace whose createWebWorker speaks the old
  // signature its worker glue expects (see createWebWorkerCompat above).
  const monacoWithLegacyWorkers = {
    ...monaco,
    editor: { ...monaco.editor, createWebWorker: createWebWorkerCompat },
  } as unknown as typeof monaco;

  const monacoYaml = configureMonacoYaml(monacoWithLegacyWorkers, {
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
      // Footer policy: an error that both panes display inline is suppressed
      // there (see footerErrorMessage); without a response (network failure)
      // fall back to the raw stored detail.
      setErrorMessage(rep == null ? getYACValidateResponse() : footerErrorMessage(rep));
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
