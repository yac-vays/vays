import { controlRenderers } from './control';
import { layoutRenderers } from './layout';
import { combinedRenderers } from './combined';

export const customRenderers = [...controlRenderers, ...layoutRenderers, ...combinedRenderers];
