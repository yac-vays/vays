// Only the editor API is imported here; the full editor (with YAML language
// support and its worker) is bundled separately via webpack (see
// webpack.config.js) and served from /editor/.
import * as m from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as y from 'monaco-yaml';

export const monaco = m;
export const monacoYaml = y;

window.monaco = monaco;
window.monacoYaml = monacoYaml;
