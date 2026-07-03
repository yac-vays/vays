import { EditorInitPlugins } from '../../../../../utils/types/internal/editor';
import editorErrorDecoration from './errorDecoration';
import editorMissingPropertyRelocator from './missingPropertyRelocator';
import editorInitializeSchema from './schemaInitializer';
import editorTheme from './theme';

export const editorSetupPlugins = [editorTheme];

const editorPlugins: EditorInitPlugins[] = [
  editorErrorDecoration,
  editorMissingPropertyRelocator,
  editorInitializeSchema,
];
export default editorPlugins;
