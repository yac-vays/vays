import BooleanControlRenderer, { BooleanControlTester } from './BooleanControlRenderer';
import DateControl, { DateControlTester } from './DateControl';
import EnumControl, { EnumControlTester } from './EnumControl';
import NumberControl, { NumberControlTester } from './NumberControl';
import OneOfEnumControl, { OneOfEnumControlTester } from './OneOfEnumControl';
import TextControl, { TextControlTester } from './TextControlRenderer';
import { VoidControl, VoidTester } from './VoidSchemaControl';
import { specialRenderers } from './special';
import MACAddressRenderer, { MacAddressRendererTester } from './special/MacAddressRenderer';
import MultiLineTextControl, {
  MultiLineTextControlTester,
} from './special/MultiLineTextControlRenderer';

export const controlRenderers = [
  { tester: TextControlTester, renderer: TextControl },
  { tester: MultiLineTextControlTester, renderer: MultiLineTextControl },
  { tester: MacAddressRendererTester, renderer: MACAddressRenderer },
  { tester: BooleanControlTester, renderer: BooleanControlRenderer },
  { tester: OneOfEnumControlTester, renderer: OneOfEnumControl },
  { tester: EnumControlTester, renderer: EnumControl },
  { tester: DateControlTester, renderer: DateControl },
  { tester: NumberControlTester, renderer: NumberControl },
  { tester: VoidTester, renderer: VoidControl },
  ...specialRenderers,
];
