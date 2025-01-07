// import * as monaco from 'monaco-editor';
import * as m from 'monaco-editor';
import * as y from 'monaco-yaml';

export const monaco = m;
export const monacoYaml = y;

window.monaco = monaco;
window.monacoYaml = monacoYaml;
// import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
// import YamlWorker from 'monaco-yaml/yaml.worker?worker';

// self.MonacoEnvironment = {
//   getWorker: function (_: any, label: string) {
//     const getWorkerModule = (moduleUrl: string, label: string) => {
//       return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
//         name: label,
//         type: 'module',
//       });
//     };

//     switch (label) {
//       case 'json':
//         return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
//       case 'css':
//       case 'scss':
//       case 'less':
//         return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
//       case 'html':
//       case 'handlebars':
//       case 'razor':
//         return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
//       case 'typescript':
//       case 'javascript':
//         return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
//       case 'yaml':
//         return getWorkerModule(
//           'https://127.0.0.1:5173/node_modules/monaco-yaml/yaaml.worker.js?worker',
//           label,
//         ); //new Worker(new URL('monaco-yaml/yaml.worker.js', import.meta.url));
//       default:
//         return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
//     }
//   },
// };
// // @ts-ignore
// self.MonacoEnvironment = {
//   getWorker(_: any, label: string) {
//     if (label === 'json') {
//       return new jsonWorker();
//     }
//     if (label === 'css' || label === 'scss' || label === 'less') {
//       return new cssWorker();
//     }
//     if (label === 'html' || label === 'handlebars' || label === 'razor') {
//       return new htmlWorker();
//     }
//     if (label === 'typescript' || label === 'javascript') {
//       return new tsWorker();
//     }

//     if (label === 'yaml') {
//       new Worker(new URL('monaco-yaml/yaml.worker.js', import.meta.url));

//       //return new YamlWorker();
//     }
//     return new editorWorker();
//   },
// };

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
