/**
 * Single point where Monaco is set up for the expert-mode YAML editor.
 *
 * This replaces the former secondary Webpack build (`webpack.config.js` +
 * `src/workerInit.js`, which produced a full ~12 MB `public/editor/` bundle that
 * *duplicated* the Monaco already bundled by Vite). Everything is now bundled by
 * Vite alone: the web workers via `?worker` imports, and only the editor
 * contributions we actually need for YAML editing.
 *
 * Import this module for its side effects *before* creating an editor
 * (`Editor.tsx` does this). It:
 *   1. registers the Monaco web workers (`MonacoEnvironment.getWorker`),
 *   2. registers the YAML syntax-highlighting grammar, and
 *   3. registers the curated set of editor feature contributions.
 *
 * It intentionally does NOT `import 'monaco-editor/esm/vs/editor/editor.all.js'`
 * (which pulls in the whole editor — Monaco's own diff editor, colour picker,
 * code lens, inlay/parameter hints, semantic tokens, rename, links, AI inline
 * completions, …). We keep only what a YAML editor with help, highlighting,
 * (custom) diff decorations and error reporting needs.
 */

// The editor.api entry is the bare API + core (no feature contributions); the
// contributions below register themselves into Monaco's shared registry on
// import, so they apply to every editor created afterwards.
import 'monaco-editor/esm/vs/editor/editor.api';

// --- Web workers (bundled + served by Vite; no MonacoEnvironment global needed
//     beyond getWorker) -------------------------------------------------------
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// Local wrapper (not `monaco-yaml/yaml.worker?worker` directly) — see yaml.worker.js.
import YamlWorker from './yaml.worker.js?worker';

// --- Required infrastructure --------------------------------------------------
import 'monaco-editor/esm/vs/editor/browser/coreCommands.js';
import 'monaco-editor/esm/vs/editor/browser/widget/codeEditor/codeEditorWidget.js';
import 'monaco-editor/esm/vs/editor/contrib/tokenization/browser/tokenization.js';
// Codicon glyph font + styles used by the widgets (hover, suggest, glyph margin).
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js';
// Localized labels for the widgets we keep (find, suggest, context menu, …).
import 'monaco-editor/esm/vs/editor/common/standaloneStrings.js';

// --- "Help": hover tooltips + completion (both fed by monaco-yaml) ------------
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
// suggestController inserts completions as snippets, so its controller is required.
import 'monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2.js';

// --- Error reporting: navigate between the markers monaco-yaml sets -----------
import 'monaco-editor/esm/vs/editor/contrib/gotoError/browser/gotoError.js';

// --- Baseline editing UX for a YAML document ----------------------------------
import 'monaco-editor/esm/vs/editor/contrib/clipboard/browser/clipboard.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/cursorUndo/browser/cursorUndo.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/comment/browser/comment.js';
import 'monaco-editor/esm/vs/editor/contrib/indentation/browser/indentation.js';
import 'monaco-editor/esm/vs/editor/contrib/lineSelection/browser/lineSelection.js';
import 'monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js';
import 'monaco-editor/esm/vs/editor/contrib/smartSelect/browser/smartSelect.js';
import 'monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/wordPartOperations/browser/wordPartOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.js';
import 'monaco-editor/esm/vs/editor/contrib/readOnlyMessage/browser/contribution.js';

// --- YAML syntax highlighting -------------------------------------------------
// The Monarch grammar is NOT provided by monaco-yaml (which only adds
// diagnostics/completion/hover), so without this the editor loses all
// highlighting. It must register onto this same Monaco instance.
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (workerId: string, label: string) => Worker;
    };
  }
}

// monaco-yaml routes its worker under the 'yaml' label; the default worker
// handles everything else the editor needs.
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'yaml') {
      return new YamlWorker();
    }
    return new EditorWorker();
  },
};
