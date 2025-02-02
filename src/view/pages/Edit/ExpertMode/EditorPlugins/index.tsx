import { RequestEditContext } from '../../../../../utils/types/internal/request';
import editorErrorDecoration from './ErrorDecoration';
import editorSchemaHandler from './SchemaHandler';
import editorTheme from './Theme';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type Plugin = (
  ed: monaco.editor.IStandaloneCodeEditor,
  requestContext: RequestEditContext,
  reInvoked?: boolean,
) => Promise<void>;

export const editorSetupPlugins = [editorTheme];

const editorPlugins: Plugin[] = [editorErrorDecoration, editorSchemaHandler];
export default editorPlugins;
