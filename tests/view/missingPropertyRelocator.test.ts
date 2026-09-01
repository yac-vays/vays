/**
 * relocateMissingPropertyMarkers: monaco-yaml anchors "Missing property"
 * diagnostics on the object node (visually its FIRST property); the editor
 * relocates ROOT-LEVEL ones (anchored at column 1) to the phantom last line,
 * where the property would actually be added. Nested objects (e.g. list
 * elements) are indented, so their markers already point at the right object
 * and stay put. The `null` return for the already-relocated case is
 * load-bearing: re-setting unchanged markers would re-fire the marker-change
 * listener and loop forever.
 */
import { describe, expect, it } from 'vitest';
import { relocateMissingPropertyMarkers } from '../../src/view/pages/Edit/ExpertMode/EditorPlugins/missingPropertyRelocator';

const marker = (message: string, line: number) => ({
  message,
  startLineNumber: line,
  startColumn: 1,
  endLineNumber: line,
  endColumn: 10,
});

describe('relocateMissingPropertyMarkers', () => {
  it('moves missing-property markers to the target line and keeps the rest', () => {
    const markers = [
      marker('Missing property "firewall_enabled".', 1),
      marker('Missing property "users_ou".', 1),
      marker('String does not match the pattern of "^a$".', 7),
    ];
    const out = relocateMissingPropertyMarkers(markers, 42, 1);
    expect(out).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [a, b, other] = out!;
    expect([a.startLineNumber, a.endLineNumber, a.startColumn, a.endColumn]).toStrictEqual([
      42, 42, 1, 1,
    ]);
    expect(b.startLineNumber).toBe(42);
    expect(other).toStrictEqual(markers[2]); // untouched
  });

  it('returns null when everything is already in place (loop protection)', () => {
    const inPlace = {
      message: 'Missing property "x".',
      startLineNumber: 42,
      startColumn: 1,
      endLineNumber: 42,
      endColumn: 1,
    };
    expect(relocateMissingPropertyMarkers([inPlace], 42, 1)).toBeNull();
    expect(relocateMissingPropertyMarkers([marker('Value must be true.', 3)], 42, 1)).toBeNull();
  });

  it('keeps nested missing-property markers (e.g. in list elements) in place', () => {
    // Anchored at column 5: a key inside a list-element object, not the root.
    const nested = {
      message: 'Missing property "port".',
      startLineNumber: 5,
      startColumn: 5,
      endLineNumber: 5,
      endColumn: 9,
    };
    expect(relocateMissingPropertyMarkers([nested], 42, 1)).toBeNull();

    // Mixed: only the root-level marker moves.
    const out = relocateMissingPropertyMarkers(
      [nested, marker('Missing property "users_ou".', 1)],
      42,
      1,
    );
    expect(out?.[0]).toStrictEqual(nested);
    expect(out?.[1].startLineNumber).toBe(42);
  });

  it('re-moves markers when the document grew (target line changed)', () => {
    const oldTarget = {
      message: 'Missing property "x".',
      startLineNumber: 42,
      startColumn: 1,
      endLineNumber: 42,
      endColumn: 1,
    };
    const out = relocateMissingPropertyMarkers([oldTarget], 50, 1);
    expect(out?.[0].startLineNumber).toBe(50);
  });
});

describe('relocateMissingPropertyMarkers with an injected root-anchor check', () => {
  it('moves a drifted marker (column shifted off 1) when the anchor check accepts it', () => {
    const drifted = {
      message: 'Missing property "zz_prop".',
      startLineNumber: 1,
      startColumn: 3, // shifted by an edit on the anchor line
      endLineNumber: 1,
      endColumn: 9,
    };
    const onRootLine = (m: { startLineNumber: number }) => m.startLineNumber === 1;
    const out = relocateMissingPropertyMarkers([drifted], 42, 5, onRootLine);
    expect(out).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(out![0].startLineNumber).toBe(42);
  });

  it('leaves nested markers alone when the anchor check rejects them', () => {
    const nested = {
      message: 'Missing property "ip".',
      startLineNumber: 5,
      startColumn: 3,
      endLineNumber: 5,
      endColumn: 9,
    };
    const onRootLine = (m: { startLineNumber: number }) => m.startLineNumber === 1;
    expect(relocateMissingPropertyMarkers([nested], 42, 5, onRootLine)).toBeNull();
  });
});
