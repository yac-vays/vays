import {
  and,
  ControlProps,
  isIntegerControl,
  isNumberControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deregisterDebouncedCommit,
  registerDebouncedCommit,
  trackedDebounce,
} from '../../../controller/local/EditController/debounceRegistry';
import {
  buildLimitBar,
  clampToRange,
  clean,
  dragRange,
  formatAmount,
  LimitBarFieldSchema,
  LimitBarModel,
  percentOf,
  stepFor,
  valueAtFraction,
} from '../../../utils/limitBar';
import { LIMIT_CHIP_STYLE, LimitLevel, usagesForFormPath } from '../../../utils/limitUtils';
import ErrorRing from '../../../view/components/Form/ErrorRing';
import InfoPanel from '../../../view/components/InfoPanel';
import { useYACUsageSnapshot } from '../../../view/hooks/useYACUsages';
import OverheadLabelWithMarkdownDescr from '../../../view/thirdparty/components/ifc/Label/OverheadLabel';
import NumberInput from '../../../view/thirdparty/components/ifc/NumberInput/NumberInput';
import { isCustomRenderer } from '../../utils/customTesterUtils';
import { isOfTypeWeak, reportBadData } from '../../utils/dataSanitization';
import { multipleOfStep } from '../../utils/numberStep';

interface RendererOptions {
  unit?: unknown;
}

/** Solid colors of this field's share per level (the chips use translucent ones). */
const OWN_COLOR: Record<LimitLevel, string> = {
  ok: 'rgb(34 197 94)',
  near: 'rgb(245 158 11)',
  over: 'rgb(239 68 68)',
};
const OTHERS_COLOR = 'rgb(156 163 175)';
const TRACK_COLOR = 'rgb(156 163 175 / 0.25)';

/** `vays_options.initial` as a number (YAC may deliver templated values as strings). */
function numericInitial(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  return undefined;
}

/**
 * A number field combined with the `limits` usage anchored on it (via the
 * limit's `path`): a bar of the whole usage, split into everything else
 * ("others") and this field's share, whose end can be dragged (or moved with
 * the keyboard) to change the value. A number input next to it allows exact
 * values, and a small × in it unsets the value again (optional fields only).
 * Without a matching usage, only the number input is shown.
 *
 * Kept deliberately quiet: the only text is a live usage chip next to the
 * label (total / cap, colored like the other limit chips); the split into
 * this entity / others / free and the field's own maximum are in the chip's
 * popover and the bar's hover titles.
 *
 * The step (dragging, keyboard) is the field's `multipleOf`, else 1 for
 * integers and 0.1 for numbers (see `stepFor`).
 */
export const LimitBar = (props: ControlProps) => {
  const ropts: RendererOptions = props.uischema?.options?.renderer_options ?? {};
  const initial = numericInitial(props.uischema?.options?.initial);
  const unit = typeof ropts.unit === 'string' && ropts.unit !== '' ? ` ${ropts.unit}` : '';

  const step = stepFor(props.schema);

  /// data check (derived locally — props are shared and must not be mutated)
  let data: number | undefined = props.data;
  let badDataError = '';
  if (!isOfTypeWeak(data, 'number')) {
    badDataError = reportBadData(data);
    data = undefined;
  }
  ///

  const { usages, data: measuredData } = useYACUsageSnapshot();
  const fieldUsages = useMemo(() => usagesForFormPath(usages, props.path), [usages, props.path]);

  // The value while dragging / before the debounced commit reached the data.
  const [draft, setDraft] = useState<{ v: number | undefined } | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const shown = draft ? draft.v : data;

  const model: LimitBarModel | null = useMemo(
    () =>
      buildLimitBar({
        usages: fieldUsages,
        measuredData,
        path: props.path,
        value: shown,
        initial,
        schema: props.schema as unknown as LimitBarFieldSchema,
        step,
      }),
    [fieldUsages, measuredData, props.path, shown, initial, props.schema, step],
  );

  const commit = useCallback(
    trackedDebounce((v: number | undefined) => props.handleChange(props.path, v), 800),
    [props.path],
  );
  // Let the commit path flush a still-pending debounced edit before saving.
  useEffect(() => {
    registerDebouncedCommit(commit);
    return () => deregisterDebouncedCommit(commit);
  }, [commit]);

  // Once the committed value arrived in the data, the draft is obsolete.
  const dragging = useRef<{ model: LimitBarModel; range: { lo: number; hi: number } } | null>(null);
  useEffect(() => {
    if (draft && !dragging.current && !commit.pending() && draft.v === data) setDraft(null);
  }, [data, draft, commit]);

  const barRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const interactive = props.enabled && model != null;

  const fractionAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || model == null || e.button !== 0) return;
    e.preventDefault();
    barRef.current?.setPointerCapture?.(e.pointerId);
    // Freeze the scale for the whole drag, so the mapping does not move under the pointer.
    dragging.current = { model, range: dragRange(model, model.own) };
    setDraft({ v: valueAtFraction(model, fractionAt(e.clientX), dragging.current.range, step) });
    handleRef.current?.focus();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragging.current;
    if (d == null) return;
    setDraft({ v: valueAtFraction(d.model, fractionAt(e.clientX), d.range, step) });
  };
  const onPointerUp = () => {
    if (dragging.current == null) return;
    dragging.current = null;
    const v = draftRef.current?.v;
    commit(v);
    commit.flush();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || model == null) return;
    const range = dragRange(model, model.own);
    const keys: { [key: string]: number } = {
      ArrowRight: model.own + step,
      ArrowUp: model.own + step,
      ArrowLeft: model.own - step,
      ArrowDown: model.own - step,
      PageUp: model.own + 10 * step,
      PageDown: model.own - 10 * step,
      Home: range.lo,
      End: range.hi,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const v = clampToRange(clean(keys[e.key], step), range, step);
    setDraft({ v });
    commit(v);
  };

  // Unset the value again (it then counts with `initial`), see the × in the input.
  const onReset = () => {
    setDraft({ v: undefined });
    commit(undefined);
    commit.flush();
  };

  const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number.isNaN(ev.target.valueAsNumber) ? undefined : ev.target.valueAsNumber;
    setDraft({ v });
    commit(v);
  };

  // After all hooks: rules of hooks forbid an early return before them.
  if (!props.visible) return <></>;

  const errorMsg = badDataError || props.errors || '';
  const fmt = (n: number) => formatAmount(n, step);
  const input = (
    <NumberInput
      id={props.id}
      data={shown}
      defaultv={props.schema.default}
      placeholder={props.uischema.options?.initial}
      placeholderEditable={props.uischema.options?.initial_editable}
      step={multipleOfStep(props.schema)}
      enabled={props.enabled}
      onChange={onInputChange}
      onReset={props.enabled && !props.required && shown !== undefined ? onReset : undefined}
      // The bar is the stepper here; the spinner only crowds the small box.
      hideSpinner={model != null}
    />
  );

  return (
    <div className="p-1">
      <OverheadLabelWithMarkdownDescr
        title={props.label}
        required={props.required || false}
        description={props.description}
        errors={errorMsg}
        // The bar replaces the usage chips (by its own live one); without a usage, keep them.
        path={model ? undefined : props.path}
        adornment={model ? renderChip(model) : undefined}
      />
      <ErrorRing errors={errorMsg}>
        {model == null ? (
          input
        ) : (
          <div className="flex flex-row items-center gap-3">
            <div className="grow min-w-0" data-testid="limit-bar">
              {renderBar(model)}
            </div>
            <div className="w-32 shrink-0">{input}</div>
          </div>
        )}
      </ErrorRing>
    </div>
  );

  /** The live total / cap, with the breakdown in its popover. */
  function renderChip(m: LimitBarModel) {
    const total = clean(m.others + m.own, step);
    const lines = [
      `This entity: ${fmt(m.own)}${unit}${m.ownIsInitial ? ' (initial)' : ''}`,
      `Others: ${fmt(m.others)}${unit}`,
      m.free >= 0 ? `Free: ${fmt(m.free)}${unit}` : `Over by: ${fmt(-m.free)}${unit}`,
    ];
    if (m.fieldMax !== undefined) lines.push(`Max. per entity: ${fmt(m.fieldMax)}${unit}`);
    return (
      <InfoPanel title={m.usage.title} description={lines.join('\n')}>
        <span
          data-testid="limit-bar-chip"
          className="inline-flex items-center whitespace-nowrap rounded-sm px-1.5 text-xs font-medium cursor-help"
          style={LIMIT_CHIP_STYLE[m.level]}
        >
          {fmt(total)} / {fmt(m.max)}
          {unit}
        </span>
      </InfoPanel>
    );
  }

  function renderBar(m: LimitBarModel) {
    const total = clean(m.others + m.own, step);
    const fieldMaxAt =
      m.fieldMax !== undefined && m.others + m.fieldMax < m.scaleMax
        ? percentOf(m, m.others + m.fieldMax)
        : undefined;
    return (
      <div
        ref={barRef}
        className={`relative flex h-5 items-center select-none touch-none ${
          interactive ? 'cursor-pointer' : 'opacity-60'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* the track with the others' and this entity's share */}
        <div
          className="relative h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: TRACK_COLOR }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${percentOf(m, m.others)}%`, backgroundColor: OTHERS_COLOR }}
            title={`Others: ${fmt(m.others)}${unit}`}
          />
          <div
            data-testid="limit-bar-own"
            className="absolute inset-y-0"
            style={{
              left: `${percentOf(m, m.others)}%`,
              width: `${percentOf(m, total) - percentOf(m, m.others)}%`,
              backgroundColor: OWN_COLOR[m.level],
              // An unset field counts with its initial value: shown, but fainter.
              opacity: m.ownIsInitial ? 0.5 : 1,
            }}
            title={`This entity: ${fmt(m.own)}${unit}`}
          />
        </div>
        {m.max < m.scaleMax && (
          <div
            className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${percentOf(m, m.max)}%`, backgroundColor: OWN_COLOR.over }}
            title={`Limit: ${fmt(m.max)}${unit}`}
          />
        )}
        {fieldMaxAt !== undefined && (
          <div
            data-testid="limit-bar-field-max"
            className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current text-plainfont opacity-40"
            style={{ left: `${fieldMaxAt}%` }}
            title={`Max. per entity: ${fmt(m.fieldMax as number)}${unit}`}
          />
        )}
        <div
          ref={handleRef}
          role="slider"
          tabIndex={interactive ? 0 : -1}
          aria-label={props.label}
          aria-valuemin={m.lo}
          aria-valuemax={dragRange(m, m.own).hi}
          aria-valuenow={m.own}
          aria-valuetext={`${fmt(m.own)}${unit}`}
          aria-disabled={!interactive}
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stroke bg-white shadow outline-hidden focus:ring-2 focus:ring-primary ${
            interactive ? 'cursor-ew-resize' : ''
          }`}
          style={{ left: `${percentOf(m, total)}%` }}
          title={`This entity: ${fmt(m.own)}${unit}`}
          onKeyDown={onKeyDown}
        />
      </div>
    );
  }
};

export const LimitBarTester: RankedTester = rankWith(
  23,
  and(or(isNumberControl, isIntegerControl), isCustomRenderer('limit_bar')),
);

export default withJsonFormsControlProps(LimitBar);
