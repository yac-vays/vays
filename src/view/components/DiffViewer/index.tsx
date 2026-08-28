import { useEffect, useState } from 'react';
import { registerDiffViewerCallback } from '../../../controller/global/diffViewer';

/**
 * Per-line coloring for a unified diff (what YAC's `patch` field contains):
 * file headers bold, hunk headers in the primary color, additions green,
 * removals red, context lines dimmed.
 */
function diffLineClass(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) return 'font-semibold text-plainfont';
  if (line.startsWith('@@')) return 'text-reducedfont font-medium';
  if (line.startsWith('+')) return 'bg-[#1EA779]/10 text-[#1EA779]';
  if (line.startsWith('-')) return 'bg-[#d32f2f]/10 text-[#d32f2f]';
  return 'text-reducedfont';
}

/**
 * Global overlay showing a unified diff in a syntax-highlighted code box.
 * Mounted once at the app root; opened from anywhere via `showDiffViewer`
 * (e.g. the "Show changes" link in the post-commit success toast).
 */
const DiffViewer = () => {
  const [content, setContent] = useState<{ title: string; patch: string } | null>(null);

  useEffect(() => {
    registerDiffViewerCallback((title: string, patch: string) => setContent({ title, patch }));
    return () => registerDiffViewerCallback(null);
  }, []);

  useEffect(() => {
    if (content == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setContent(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [content]);

  if (content == null) return <></>;

  return (
    <div
      className="fixed left-0 top-0 z-99999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
      onClick={() => setContent(null)}
    >
      <div
        className="relative w-full max-w-180 rounded bg-white px-10 py-8 dark:bg-boxdark"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-plainfont sm:text-2xl mt-0 pb-4">{content.title}</h3>
        {/* Neutral (grey) background on purpose: the diff carries its own
            red/green semantics, mixing in the theme color looks off. */}
        <pre className="max-h-[60vh] overflow-auto rounded border border-stroke bg-[#f5f5f5] p-4 text-sm leading-6 dark:border-form-strokedark dark:bg-form-input">
          {content.patch.split('\n').map((line, i) => (
            <div key={i} className={`px-1 ${diffLineClass(line)}`}>
              {/* Keep empty lines from collapsing to zero height. */}
              {line === '' ? ' ' : line}
            </div>
          ))}
        </pre>
        <div className="flex justify-end pt-6">
          <button
            className="rounded border border-stroke bg-primary-5 py-2 px-6 text-center font-medium text-plainfont transition hover:border-meta-4 hover:bg-meta-4 hover:text-white dark:bg-meta-4 dark:hover:bg-white dark:hover:text-black"
            onClick={() => setContent(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
