import { CircularProgressbarWithChildren } from 'react-circular-progressbar';

const ICON_WARNING =
  'm40-120 440-760 440 760H40Zm440-120q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Z';

/**
 * Indicator of the `window` renderers: the grey ring of all log indicators
 * with a symbol for the kind of content, and — if the newest entry reports a
 * problem — a small amber warning badge. Deliberately lighter than the red
 * ring of the `problem` renderer: a document is still usable when it warns.
 */
const SymbolIndicator = ({
  symbol,
  problem,
  label,
}: {
  /** Path of a material symbol (viewBox 0 -960 960 960). */
  symbol: string;
  problem: boolean | null;
  /** Tooltip, e.g. the message of the newest entry. */
  label?: string;
}) => (
  <div className="relative" title={label || undefined}>
    <CircularProgressbarWithChildren
      value={100}
      styles={{
        root: { imageRendering: 'crisp-edges', transform: 'scale(1)' },
        path: { stroke: 'grey' },
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-80"
        height="55%"
        viewBox="0 -960 960 960"
        fill="grey"
        aria-hidden="true"
      >
        <path d={symbol} />
      </svg>
    </CircularProgressbarWithChildren>
    {problem === true && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        className="absolute -right-1 -top-1 h-1/2 w-1/2 fill-[#e0a100] drop-shadow"
        role="img"
        aria-label="Warning"
      >
        <path d={ICON_WARNING} />
      </svg>
    )}
  </div>
);

export default SymbolIndicator;
