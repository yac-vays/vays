import BooleanControlRenderer, { BooleanControlTester } from './BooleanControlRenderer';
import DateControl, { DateControlTester } from './DateControl';
import EnumControl, { EnumControlTester } from './EnumControl';
import MultipleChoiceRenderer, { MultipleChoiceTester } from './MultipleChoiceRenderer';
import NumberControl, { NumberControlTester } from './NumberControl';
import OneOfEnumControl, { OneOfEnumControlTester } from './OneOfEnumControl';
import TextControl, { TextControlTester } from './TextControlRenderer';
import UnavailableControl, { UnavailableTester } from './UnavailableControl';
import { VoidControl, VoidTester } from './VoidSchemaControl';
import { specialRenderers } from './special';

export const controlRenderers = [
  { tester: TextControlTester, renderer: TextControl },
  { tester: BooleanControlTester, renderer: BooleanControlRenderer },
  { tester: OneOfEnumControlTester, renderer: OneOfEnumControl },
  { tester: EnumControlTester, renderer: EnumControl },
  { tester: DateControlTester, renderer: DateControl },
  { tester: NumberControlTester, renderer: NumberControl },
  { tester: VoidTester, renderer: VoidControl },
  { tester: UnavailableTester, renderer: UnavailableControl },
  { tester: MultipleChoiceTester, renderer: MultipleChoiceRenderer },
  ...specialRenderers,
];
