import ArrayControlRenderer, { ArrayControlTester } from './ArrayRenderer/ArrayRenderer';
import MultiCheckboxRenderer, { MultiCheckboxTester } from './MultiCheckboxRenderer';
import ArrayLayoutRenderer, { ArrayLayoutTester } from './NestedObjectRenderer';

export const combinedRenderers = [
  { tester: ArrayControlTester, renderer: ArrayControlRenderer },
  { tester: ArrayLayoutTester, renderer: ArrayLayoutRenderer },
  { tester: MultiCheckboxTester, renderer: MultiCheckboxRenderer },
];
