// Local wrapper around monaco-yaml's worker entry.
//
// Importing `monaco-yaml/yaml.worker?worker` directly from node_modules trips a
// Vite bug: the worker's CommonJS dependencies aren't transformed, so the worker
// throws `module is not defined` on load and Monaco silently loses all YAML
// language features (diagnostics/markers, completion, hover). Re-exporting it
// from a project-local file routes it through Vite's normal source pipeline,
// which fixes the transform. See monaco-yaml README, "Why doesn't it work with
// Vite?".
import 'monaco-yaml/yaml.worker.js';
