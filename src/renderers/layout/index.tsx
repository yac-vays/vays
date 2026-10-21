import CategorizationLayout, { CategorizationTester } from './CategorizationLayout';
import GroupLayoutRenderer, { groupTester } from './GroupLayout';
import RowLayout, { rowLayoutTester } from './RowLayout';

export const layoutRenderers = [
  { tester: CategorizationTester, renderer: CategorizationLayout },
  { tester: groupTester, renderer: GroupLayoutRenderer },
  { tester: rowLayoutTester, renderer: RowLayout },
];
