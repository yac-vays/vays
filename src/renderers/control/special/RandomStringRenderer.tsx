import { and, ControlProps, isStringControl, or, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ChangeEvent, useCallback, useEffect, useRef } from 'react';
import { tsAddWarningMessage } from '../../../controller/global/troubleshoot';
import { getCurrentContext } from '../../../controller/local/EditController/ExpertMode/access';
import {
  deregisterDebouncedCommit,
  trackedDebounce,
  registerDebouncedCommit,
} from '../../../controller/local/EditController/debounceRegistry';
import {
  DEFAULT_RANDOM_STRING_FORMAT,
  DEFAULT_RANDOM_STRING_LENGTH,
  generateRandomString,
  RandomStringFormat,
  RANDOM_STRING_FORMATS,
} from '../../../utils/randomString';
import { consumeEagerGenerated } from '../../../utils/schema/eagerValues';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import { useModalContext } from '../../../view/components/Modal/ModalContext';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../../view/thirdparty/components/ifc/TextInput/TextInput';
import { isCustomRenderer, isUntypedStringInput } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';

interface RendererOptions {
  format?: RandomStringFormat;
  length?: number;
  charset?: string;
}

export const RandomStringRenderer = (props: ControlProps) => {
  const ropts: RendererOptions = props.uischema?.options?.renderer_options ?? {};
  const format: RandomStringFormat = ropts.format ?? DEFAULT_RANDOM_STRING_FORMAT;
  const length =
    typeof ropts.length === 'number' && ropts.length > 0
      ? Math.floor(ropts.length)
      : DEFAULT_RANDOM_STRING_LENGTH;

  let specError: string | null = null;
  if (!RANDOM_STRING_FORMATS.includes(format)) {
    specError = `Spec error: renderer 'random_string' does not know format '${format}'. Valid formats: ${RANDOM_STRING_FORMATS.join(
      ', ',
    )}.`;
  } else if (format === 'custom' && (!ropts.charset || typeof ropts.charset !== 'string')) {
    specError =
      "Spec error: renderer 'random_string' with format 'custom' requires `vays_options.renderer_options.charset`.";
  }

  /// data check (derived locally — props/uischema are shared and must not be mutated)
  let storedData = props.data;
  let badDataError = '';
  if (!isOfTypeWeak(storedData, 'string')) {
    badDataError = reportBadData(storedData);
    storedData = undefined;
  }
  ///

  const hasData = storedData !== undefined && storedData !== '';
  // A value that came in from YAC (present on first render, not yet replaced
  // this session) gets a confirmation dialog before being overwritten. A value
  // the eager load-time pass generated is NOT a YAC value: regenerating it
  // silently matches the mount-generation behavior.
  const hasYacValue = useRef<boolean | null>(null);
  if (hasYacValue.current === null)
    hasYacValue.current = hasData && !consumeEagerGenerated(props.path);

  const autoGenStarted = useRef<boolean>(false);
  const { showModal } = useModalContext();

  if (specError) {
    tsAddWarningMessage(
      9,
      "Invalid renderer_options for renderer 'random_string'",
      specError,
      props.path.split('/').pop() ?? 'key',
      getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
    );
  }

  const doGenerate = useCallback(() => {
    hasYacValue.current = false;
    props.handleChange(props.path, generateRandomString(format, length, ropts.charset));
  }, [format, length, ropts.charset, props.path]);

  // Set the random value exactly once: only if YAC supplied neither a value
  // nor a default for this field (a spec default wins over generation).
  // Deferred one macrotask: on initial mount the JsonForms provider re-dispatches
  // updateCore(props.data) in its own effect AFTER child effects, which would
  // silently wipe a value dispatched synchronously from here.
  useEffect(() => {
    if (autoGenStarted.current) return;
    if (!props.visible || !props.enabled) return;
    if (specError) return;
    if (hasData) return;
    if (props.schema.default !== undefined) return;
    const t = setTimeout(() => {
      autoGenStarted.current = true;
      doGenerate();
    }, 0);
    return () => clearTimeout(t);
  }, [props.visible, props.enabled, specError, hasData, props.schema.default, doGenerate]);

  const update = useCallback(
    trackedDebounce(
      (value: string) => props.handleChange(props.path, value ? value : undefined),
      1500,
    ),
    [props.path],
  );

  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(update);
    return () => deregisterDebouncedCommit(update);
  }, [update]);

  // After all hooks: rules of hooks forbid an early return before them.
  if (!props.visible) return <></>;

  const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
    hasYacValue.current = false;
    // A manual edit (including clearing the field) opts out of auto-generation.
    autoGenStarted.current = true;
    update(ev.target.value);
  };

  const onRegenerateClick = () => {
    if (!hasYacValue.current) {
      doGenerate();
      return;
    }
    showModal(
      'Replace the existing value?',
      'This generates a new random value and replaces the existing one.\n\nThe change is only effective after you save the form.',
      async () => {
        doGenerate();
      },
      async () => {},
      'Replace',
      false,
    );
  };

  const errorMsg = specError || badDataError || props.errors || '';

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label ?? props.schema.title}
        required={props.required || false}
        description={props.description}
        errors={errorMsg}
      />
      <ErrorRing errors={errorMsg}>
        <div className="flex flex-row gap-2 items-stretch">
          <div className="grow">
            <TextInput
              enabled={props.enabled && !specError}
              defaultv={props.schema.default}
              data={storedData}
              onChange={onChange}
            />
          </div>
          {props.enabled && !specError && (
            <button
              type="button"
              onClick={onRegenerateClick}
              className="rounded-md border border-stroke px-3 py-2 text-sm hover:bg-meta-4 hover:text-white whitespace-nowrap"
            >
              Regenerate
            </button>
          )}
        </div>
      </ErrorRing>
    </div>
  );
};

export const RandomStringRendererTester: RankedTester = rankWith(
  22,
  and(or(isStringControl, isUntypedStringInput), isCustomRenderer('random_string')),
);
export default withJsonFormsControlProps(RandomStringRenderer);
