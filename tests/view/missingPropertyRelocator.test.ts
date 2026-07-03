/**
 * relocateMissingPropertyMarkers: monaco-yaml anchors "Missing property"
 * diagnostics on the object node (visually the FIRST property); the editor
 * relocates them to the phantom last line, where the property would actually
 * be added. The `null` return for the already-relocated case is load-bearing:
 * re-setting unchanged markers would re-fire the marker-change listener and
 * loop forever.
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
