/**
 * relocateMissingPropertyMarkers + missingPropertyPlacer: monaco-yaml anchors
 * "Missing property" diagnostics on the line introducing the object — the KEY
 * of an object that is a map entry's value (`mail:` + nested entries), the
 * own first property of a list element — and both stay put. Only the ROOT
 * object's marker (on the document's first property) is relocated to the
 * phantom last line; a top-level key's marker sits at column 1 too but must
 * never land there (it would read as a missing TOP-LEVEL property). The `null`
 * return for the already-relocated case is load-bearing: re-setting unchanged
 * markers would re-fire the marker-change listener and loop forever.
 */
import { describe, expect, it } from 'vitest';
import {
  MarkerRange,
  missingPropertyPlacer,
  PlacementModel,
  relocateMissingPropertyMarkers,
} from '../../src/view/pages/Edit/ExpertMode/EditorPlugins/missingPropertyRelocator';

/** Minimal stand-in for monaco's ITextModel (1-based lines and columns). */
function fakeModel(text: string): PlacementModel {
  const lines = text.split('\n');
  const lineStart = (lineNumber: number) =>
    lines.slice(0, lineNumber - 1).reduce((n, l) => n + l.length + 1, 0);
  return {
    getValue: () => text,
    getLineCount: () => lines.length,
    getLineMaxColumn: (lineNumber) => lines[lineNumber - 1].length + 1,
    getPositionAt: (offset) => {
      const before = text.slice(0, Math.max(0, Math.min(offset, text.length))).split('\n');
      return { lineNumber: before.length, column: before[before.length - 1].length + 1 };
    },
    getOffsetAt: ({ lineNumber, column }) => lineStart(lineNumber) + column - 1,
  };
}

const at = (message: string, line: number, startColumn: number, endColumn: number) => ({
  message,
  startLineNumber: line,
  startColumn,
  endLineNumber: line,
  endColumn,
});

const lineAndColumns = (m: MarkerRange) => [
  m.startLineNumber,
  m.startColumn,
  m.endLineNumber,
  m.endColumn,
];

/** Relocate `markers` against `text`, as the live listener does. */
const relocate = (text: string, markers: MarkerRange[]) =>
  relocateMissingPropertyMarkers(markers, missingPropertyPlacer(fakeModel(text)));

// The systems_hacc case: `interval` missing below `monitoring_notification_mail`
// (line 3), phantom last line 8.
const hacc =
  'users_restrict_login: false\n\nmonitoring_notification_mail:\n  period: 9to5\n\nmail_root:\n  - x\n';

describe('relocateMissingPropertyMarkers', () => {
  const placeOnLine42 = () => ({
    startLineNumber: 42,
    startColumn: 1,
    endLineNumber: 42,
    endColumn: 1,
  });

  it('moves missing-property markers only and keeps the rest', () => {
    const markers = [
      at('Missing property "users_ou".', 1, 1, 10),
      at('String does not match the pattern of "^a$".', 7, 1, 10),
    ];
    const out = relocateMissingPropertyMarkers(markers, placeOnLine42);
    expect(out && lineAndColumns(out[0])).toStrictEqual([42, 1, 42, 1]);
    expect(out?.[1]).toStrictEqual(markers[1]); // untouched
  });

  it('returns null when everything is already in place (loop protection)', () => {
    expect(
      relocateMissingPropertyMarkers([at('Missing property "x".', 42, 1, 1)], placeOnLine42),
    ).toBeNull();
    expect(
      relocateMissingPropertyMarkers([at('Value must be true.', 3, 1, 10)], placeOnLine42),
    ).toBeNull();
    expect(
      relocateMissingPropertyMarkers([at('Missing property "x".', 3, 1, 10)], () => null),
    ).toBeNull();
  });
});

describe('missingPropertyPlacer', () => {
  it('moves a root-level marker to the phantom last line', () => {
    // monaco-yaml: the root map's offset, length 1.
    const out = relocate(hacc, [at('Missing property "users_ou".', 1, 1, 2)]);
    expect(out && lineAndColumns(out[0])).toStrictEqual([8, 1, 8, 1]);
  });

  it('moves a drifted root-level marker (column shifted off 1)', () => {
    const out = relocate(hacc, [at('Missing property "users_ou".', 1, 3, 4)]);
    expect(out?.[0].startLineNumber).toBe(8);
  });

  it('re-moves root markers when the document grew', () => {
    const out = relocate(`${hacc}a: 1\n`, [at('Missing property "users_ou".', 8, 1, 1)]);
    expect(out?.[0].startLineNumber).toBe(9);
  });

  it('keeps a nested-object marker on its key (never the document end)', () => {
    // monaco-yaml anchors it on `monitoring_notification_mail` (line 3, col 1).
    expect(relocate(hacc, [at('Missing property "interval".', 3, 1, 29)])).toBeNull();
  });

  it('tells a nested object as the first entry apart from the root object', () => {
    const text = 'mail:\n  period: 9to5\n\nb: 2\n';
    const nested = at('Missing property "interval".', 1, 1, 5); // key of `mail`
    const out = relocate(text, [nested, at('Missing property "users_ou".', 1, 1, 2)]);
    expect(out?.[0]).toStrictEqual(nested);
    expect(out && lineAndColumns(out[1])).toStrictEqual([5, 1, 5, 1]);
  });

  it('keeps markers of list-element objects in place', () => {
    // Anchored on the element's own first property (indented).
    const text = 'a: 1\nl:\n  - ip: x\n';
    expect(relocate(text, [at('Missing property "port".', 3, 5, 6)])).toBeNull();
  });
});
