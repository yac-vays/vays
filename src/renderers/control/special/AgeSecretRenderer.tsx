import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tsAddWarningMessage } from '../../../controller/global/troubleshoot';
import { getCurrentContext } from '../../../controller/local/EditController/ExpertMode/access';
import { ageEncrypt, looksLikeAgeArmor, randomSecret, SecretCharset } from '../../../utils/ageEncrypt';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import { useModalContext } from '../../../view/components/Modal/ModalContext';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

const DEFAULT_LENGTH = 32;
const DEFAULT_CHARSET: SecretCharset = 'alphanumeric';
const VALID_CHARSETS: SecretCharset[] = ['alphanumeric', 'hex', 'base64url', 'ascii_printable'];

interface RendererOptions {
  age_public_key?: string;
  length?: number;
  charset?: SecretCharset;
}

export const AgeSecretRenderer = (props: ControlProps) => {
  const ropts: RendererOptions = props.uischema?.options?.renderer_options ?? {};
  const recipient = ropts.age_public_key;
  const length =
    typeof ropts.length === 'number' && ropts.length > 0 ? Math.floor(ropts.length) : DEFAULT_LENGTH;
  const charset: SecretCharset =
    ropts.charset && VALID_CHARSETS.includes(ropts.charset) ? ropts.charset : DEFAULT_CHARSET;

  /// data check
  let data = props.data;
  let badDataError = '';
  if (!isOfTypeWeak(data, 'string')) {
    badDataError = reportBadData(data);
    data = undefined;
  }
  ///

  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const autoGenStarted = useRef<boolean>(false);

  const { showModal } = useModalContext();

  const specError =
    !recipient || typeof recipient !== 'string'
      ? "Spec error: renderer 'age_secret' requires `vays_options.renderer_options.age_public_key`."
      : null;

  if (specError) {
    tsAddWarningMessage(
      9,
      "Missing age_public_key for renderer 'age_secret'",
      "The `age_secret` renderer requires `vays_options.renderer_options.age_public_key` to be set to an AGE recipient (e.g. 'age1...'). The field cannot generate or encrypt secrets until this is fixed.",
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }

  const doGenerate = useCallback(async () => {
    if (!recipient) return;
    setPending(true);
    setOpError(null);
    setCopied(false);
    try {
      const pt = randomSecret(length, charset);
      const ct = await ageEncrypt(pt, recipient);
      setPlaintext(pt);
      props.handleChange(props.path, ct);
    } catch (e) {
      setOpError(
        `Failed to encrypt the generated secret. Check that 'age_public_key' is a valid AGE recipient. (${String(
          (e as Error)?.message ?? e,
        )})`,
      );
    } finally {
      setPending(false);
    }
  }, [recipient, length, charset, props.path]);

  useEffect(() => {
    if (autoGenStarted.current) return;
    if (!props.visible) return;
    if (!props.enabled) return;
    if (specError) return;
    if (data !== undefined && data !== '') return;
    autoGenStarted.current = true;
    void doGenerate();
  }, [props.visible, props.enabled, data, specError, doGenerate]);

  // After all hooks: rules of hooks forbid an early return before them.
  if (!props.visible) return <></>;

  const hasData = data !== undefined && data !== '';
  const dataLooksValid = !hasData || looksLikeAgeArmor(data);
  const showRegenerate = props.enabled && !specError && plaintext === null && hasData;

  let displayValue: string;
  if (plaintext !== null) displayValue = plaintext;
  else if (!hasData) displayValue = '';
  else if (looksLikeAgeArmor(data)) displayValue = '*'.repeat(length);
  else displayValue = data as string;

  const invalidValueError =
    hasData && !dataLooksValid && plaintext === null
      ? "The current value is not an encrypted secret. Use 'Generate new' to overwrite it."
      : '';

  const errorMsg = specError || opError || invalidValueError || badDataError || props.errors || '';

  const onRegenerateClick = () => {
    showModal(
      'Replace the existing secret?',
      "This generates a new random secret and replaces the existing one. The previous secret will be overwritten.\n\nThe change is only effective after you save the form.",
      async () => {
        await doGenerate();
      },
      async () => {},
      'Replace',
      false,
    );
  };

  const onCopy = async () => {
    if (plaintext === null) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still select+copy manually
    }
  };

  const inputClasses =
    'w-full rounded-md border bg-transparent px-5 py-2.5 outline-none ' +
    'border-stroke focus:border-primary ' +
    'dark:bg-meta-4 dark:focus:border-primary font-mono text-sm';

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={errorMsg}
        path={props.path}
      />
      <ErrorRing errors={errorMsg}>
        <div className="flex flex-row gap-2 items-stretch">
          <input
            type="text"
            readOnly
            disabled={!props.enabled || !!specError}
            value={pending ? 'Generating…' : displayValue}
            className={inputClasses}
            onFocus={(e) => e.target.select()}
          />
          {plaintext !== null && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md border border-stroke px-3 py-2 text-sm hover:bg-meta-4 hover:text-white whitespace-nowrap"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {showRegenerate && (
            <button
              type="button"
              onClick={onRegenerateClick}
              disabled={pending}
              className="rounded-md border border-stroke px-3 py-2 text-sm hover:bg-meta-4 hover:text-white whitespace-nowrap disabled:opacity-50"
            >
              Generate new
            </button>
          )}
        </div>
      </ErrorRing>
      {plaintext !== null && (
        <em className="opacity-70 block mt-1 text-sm">
          ⚠ Copy this secret now! Once you save the form, it will be encrypted and not readable anymore.
        </em>
      )}
    </div>
  );
};

export const AgeSecretRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('age_secret')),
);
export default withJsonFormsControlProps(AgeSecretRenderer);
