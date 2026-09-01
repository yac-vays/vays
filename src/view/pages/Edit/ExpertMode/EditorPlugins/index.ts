import { EditorInitPlugins } from '../../../../../utils/types/internal/editor';
import editorErrorDecoration from './errorDecoration';
import editorFieldHelp from './fieldHelp';
import editorLimitGlyphs from './limitGlyphs';
import editorMissingPropertyRelocator from './missingPropertyRelocator';
import editorInitializeSchema from './schemaInitializer';
import editorTheme from './theme';

export const editorSetupPlugins = [editorTheme];

const editorPlugins: EditorInitPlugins[] = [
  editorErrorDecoration,
  editorMissingPropertyRelocator,
  editorFieldHelp,
  editorLimitGlyphs,
  editorInitializeSchema,
];
export default editorPlugins;
