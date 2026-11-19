import LogPanel from '../LogPanel';
import {
  GREEN,
  GREY,
  ICONS,
  progressColor,
  RED,
  SymbolBar,
  SymbolIcon,
  SymbolText,
} from './symbols';
import type { LogRenderer, LogViewProps } from './types';

/** The popover of the list renderers: the entries, newest first. */
const ListView = ({ decl, entries }: LogViewProps) => (
  <LogPanel title={decl.title} description={decl.description} logList={entries} />
);

/** `messages` (default): a list of messages, the symbol only says there are some. */
export const messagesRenderer: LogRenderer = {
  name: 'messages',
  display: 'popover',
  Indicator: () => <SymbolIcon icon={ICONS.messages} color={GREY} />,
  View: ListView,
};

/** `problem`: a health indicator from the newest entry's `problem`. */
export const problemRenderer: LogRenderer = {
  name: 'problem',
  display: 'popover',
  Indicator: ({ latest }) =>
    latest.problem === true ? (
      <SymbolIcon icon={ICONS.error} color={RED} />
    ) : latest.problem === false ? (
      <SymbolIcon icon={ICONS.check} color={GREEN} />
    ) : (
      <SymbolIcon icon={ICONS.unknown} color={GREY} />
    ),
  View: ListView,
};

/**
 * `progress`: the newest entry's `progress` as a percentage and a bar; a check
 * when done, an error (with the bar where it stopped) on `problem`.
 */
export const progressRenderer: LogRenderer = {
  name: 'progress',
  display: 'popover',
  Indicator: ({ latest }) => {
    const { progress, problem } = latest;
    if (problem === true) {
      return (
        <>
          <SymbolIcon icon={ICONS.error} color={RED} />
          <SymbolBar value={progress ?? 0} color={RED} />
        </>
      );
    }
    if (progress == null) return <SymbolIcon icon={ICONS.unknown} color={GREY} />;
    if (progress >= 100) {
      return (
        <>
          <SymbolIcon icon={ICONS.check} color={GREEN} />
          <SymbolBar value={100} color={GREEN} />
        </>
      );
    }
    return (
      <>
        <SymbolText text={`${progress}%`} color={progressColor(progress)} />
        <SymbolBar value={progress} color={progressColor(progress)} />
      </>
    );
  },
  View: ListView,
};
