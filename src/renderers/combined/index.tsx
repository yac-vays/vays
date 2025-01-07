import ArrayControlRenderer, { ArrayControlTester } from './ArrayRenderer/ArrayRenderer';
import ArrayLayoutRenderer, { ArrayLayoutTester } from './NestedObjectRenderer';
import MultipleChoiceRenderer, { MultipleChoiceTester } from './MultipleChoiceRenderer';
import MultiCheckboxRenderer, { MultiCheckboxTester } from './MultiCheckboxRenderer';

export const combinedRenderers = [
  { tester: ArrayControlTester, renderer: ArrayControlRenderer },
  { tester: ArrayLayoutTester, renderer: ArrayLayoutRenderer },
  { tester: MultipleChoiceTester, renderer: MultipleChoiceRenderer },
  { tester: MultiCheckboxTester, renderer: MultiCheckboxRenderer },
];
