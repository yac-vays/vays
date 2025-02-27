import BigStringArray, { BigStringArrayTester } from './BigStringArray';
import InfoBoxRenderer, { InfoBoxTester } from './InfoBoxRenderer';
import ListAsStringRenderer, { ListAsStringTester } from './ListAsStringRenderer';
import MACAddressRenderer, { MacAddressRendererTester } from './MacAddressRenderer';
import MultiLineTextControl, { MultiLineTextControlTester } from './MultiLineTextControlRenderer';
import PasswordRenderer, { PasswordRendererTester } from './PasswordRenderer';
import SSHKeyRenderer, { SSHKeyRendererTester } from './SSHKeyRenderer';

export const specialRenderers = [
  { tester: InfoBoxTester, renderer: InfoBoxRenderer },
  { tester: PasswordRendererTester, renderer: PasswordRenderer },
  { tester: SSHKeyRendererTester, renderer: SSHKeyRenderer },
  { tester: ListAsStringTester, renderer: ListAsStringRenderer },
  { tester: BigStringArrayTester, renderer: BigStringArray },
  { tester: MultiLineTextControlTester, renderer: MultiLineTextControl },
  { tester: MacAddressRendererTester, renderer: MACAddressRenderer },
];
