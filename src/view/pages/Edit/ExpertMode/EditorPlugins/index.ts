import { EditorInitPlugins } from '../../../../../utils/types/internal/editor';
import editorErrorDecoration from './errorDecoration';
import editorFieldHelp from './fieldHelp';
import editorLimitGlyphs from './limitGlyphs';
import editorLockedRegions from './lockedRegions';
import editorMissingPropertyRelocator from './missingPropertyRelocator';
import editorInitializeSchema from './schemaInitializer';
import editorTheme from './theme';

export const editorSetupPlugins = [editorTheme];

const editorPlugins: EditorInitPlugins[] = [
  editorErrorDecoration,
  editorMissingPropertyRelocator,
  editorFieldHelp,
  editorLimitGlyphs,
  editorLockedRegions,
  editorInitializeSchema,
];
export default editorPlugins;
