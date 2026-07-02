import { afterEach, describe, expect, it } from 'vitest';
import {
  diffToastLink,
  registerDiffViewerCallback,
  showDiffViewer,
} from '../../src/controller/global/diffViewer';

const PATCH = '--- a/host/foo.yaml\n+++ b/host/foo.yaml\n@@ -1 +1 @@\n-a: 1\n+a: 2';

afterEach(() => registerDiffViewerCallback(null));

describe('diffToastLink', () => {
  it('returns no link when the response carried no patch', () => {
    expect(diffToastLink('Changes', undefined)).toBeUndefined();
    expect(diffToastLink('Changes', '')).toBeUndefined();
  });

  it('opens the diff viewer with the patch when clicked', () => {
    let shown: { title: string; patch: string } | null = null;
    registerDiffViewerCallback((title, patch) => {
      shown = { title, patch };
    });

    const link = diffToastLink("Changes to 'foo'", PATCH);
    expect(link).toBeDefined();
    expect(link?.label).toBe('Show changes');

    link?.onClick();
    expect(shown).toEqual({ title: "Changes to 'foo'", patch: PATCH });
  });
});

describe('showDiffViewer', () => {
  it('is a no-op when the viewer is not mounted', () => {
    expect(() => showDiffViewer('t', PATCH)).not.toThrow();
  });
});
