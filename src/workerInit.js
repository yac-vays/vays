// Only the editor API is imported here; the editor UI features and the
// monaco-yaml worker are bundled separately via webpack (see webpack.config.js)
// and served from /editor/.
import * as m from 'monaco-editor/esm/vs/editor/editor.api.js';
// The YAML *syntax-highlighting* grammar (Monarch tokenizer) must be registered
// into this — the runtime monaco singleton the React app actually creates its
// model with. It is NOT provided by monaco-yaml (which only adds diagnostics,
// completion and hover), so without this import the expert-mode editor loses
// all syntax highlighting.
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';
import * as y from 'monaco-yaml';

export const monaco = m;
export const monacoYaml = y;

window.monaco = monaco;
window.monacoYaml = monacoYaml;
