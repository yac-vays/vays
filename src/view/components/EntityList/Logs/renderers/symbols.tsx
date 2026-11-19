/**
 * Building blocks of the log symbols in the status column. A symbol is a
 * square in the look of the action buttons (see `iconButtonClassName`); the
 * symbols of an entity form one group like the action buttons do. The square
 * itself is drawn by `LogsField` (also while loading and for logs without
 * entries); the renderers' `Indicator`s only fill it.
 */
import { progressColor } from '../../../../../utils/logUtils';

export const GREEN = '#10B981';
export const RED = '#DC3545';
export const AMBER = '#e0a100';
/** Neutral symbols, the grey of the action button icons. */
export const GREY = '#64748b';

/** Paths of material symbols (viewBox 0 -960 960 960). */
export const ICONS = {
  check:
    'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
  error:
    'M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
  unknown:
    'M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
  messages: 'M120-240v-80h480v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z',
  document:
    'M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z',
  article:
    'M280-280h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z',
  none: 'M200-440v-80h560v80H200Z',
  warning:
    'm40-120 440-760 440 760H40Zm440-120q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Z',
};

/** Side length of a symbol, the same as an action button. */
export const SYMBOL_SIZE = 36;

/**
 * The square of one symbol. `first` / `last` round the outer corners of the
 * group (like the action buttons).
 */
export const SymbolFrame = ({
  first,
  last,
  title,
  children,
}: {
  first: boolean;
  last: boolean;
  title?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`group/symbol relative flex items-center justify-center bg-[#f5f5f5] dark:bg-meta-4 ${
      first ? 'rounded-l' : ''
    } ${last ? 'rounded-r' : ''}`}
    style={{ width: SYMBOL_SIZE, height: SYMBOL_SIZE }}
    title={title}
  >
    {children}
  </div>
);

/** An icon of a symbol; grows on hover like the action button icons. */
export const SymbolIcon = ({ icon, color, size = 20 }: { icon: string; color: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    width={size}
    height={size}
    fill={color}
    aria-hidden="true"
    className="duration-300 group-hover/symbol:scale-125"
  >
    <path d={icon} />
  </svg>
);

/** A percentage instead of an icon (e.g. a running installation). */
export const SymbolText = ({ text, color }: { text: string; color: string }) => (
  <span
    className="text-xs font-semibold tabular-nums duration-300 group-hover/symbol:scale-110"
    style={{ color }}
  >
    {text}
  </span>
);

/** A progress bar along the bottom edge of the square. */
export const SymbolBar = ({ value, color }: { value: number; color: string }) => (
  <div
    className="absolute inset-x-1 bottom-1 h-[3px] rounded-full bg-[#e2e8f0] dark:bg-[#4b5563]"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.max(4, Math.min(100, value))}%`, background: color }}
    />
  </div>
);

/** A light warning in the top right corner (e.g. outdated document). */
export const SymbolWarning = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    width={11}
    height={11}
    fill={AMBER}
    role="img"
    aria-label="Warning"
    className="absolute right-0.5 top-0.5"
  >
    <path d={ICONS.warning} />
  </svg>
);

/** While the entries are being fetched. */
export const SymbolLoading = () => (
  <div
    className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#a8a8a8] border-t-transparent"
    role="status"
    aria-label="Loading"
  />
);

/** A log without entries. */
export const SymbolNone = () => <SymbolIcon icon={ICONS.none} color="#94a3b8" size={16} />;

/** The colour of a progress (red to green, see `progressColor`). */
export { progressColor };
