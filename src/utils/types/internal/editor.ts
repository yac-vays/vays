import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { RequestEditContext } from './request';

export type EditorInitPlugins = (
  ed: monaco.editor.IStandaloneCodeEditor,
  requestContext: RequestEditContext,
  reInvoked?: boolean,
) => Promise<void>;
