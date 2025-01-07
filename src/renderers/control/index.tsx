import TextControl, { TextControlTester } from './TextControlRenderer';
import BooleanControlRenderer, { BooleanControlTester } from './BooleanControlRenderer';
import OneOfEnumControl, { OneOfEnumControlTester } from './OneOfEnumControl';
import EnumControl, { EnumControlTester } from './EnumControl';
import DateControl, { DateControlTester } from './DateControl';
import NumberControl, { NumberControlTester } from './NumberControl';
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
  ...specialRenderers,
];
