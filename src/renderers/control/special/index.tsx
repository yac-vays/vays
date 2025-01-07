import BigStringArray, { BigStringArrayTester } from './BigStringArray';
import InfoBoxRenderer, { InfoBoxTester } from './InfoBoxRenderer';
import ListAsStringRenderer, { ListAsStringTester } from './ListAsStringRenderer';
import PasswordRenderer, { PasswordRendererTester } from './PasswordRenderer';
import SSHKeyRenderer, { SSHKeyRendererTester } from './SSHKeyRenderer';

export const specialRenderers = [
  { tester: InfoBoxTester, renderer: InfoBoxRenderer },
  { tester: PasswordRendererTester, renderer: PasswordRenderer },
  { tester: SSHKeyRendererTester, renderer: SSHKeyRenderer },
  { tester: ListAsStringTester, renderer: ListAsStringRenderer },
  { tester: BigStringArrayTester, renderer: BigStringArray },
];
