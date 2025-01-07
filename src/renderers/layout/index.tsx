import CategorizationLayout, { CategorizationTester } from './CategorizationLayout';
import GroupLayoutRenderer, { groupTester } from './GroupLayout';

export const layoutRenderers = [
  { tester: CategorizationTester, renderer: CategorizationLayout },
  { tester: groupTester, renderer: GroupLayoutRenderer },
];
