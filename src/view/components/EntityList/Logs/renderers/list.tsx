import BoolLog from '../BoolLog';
import LogPanel from '../LogPanel';
import MessageLog from '../MessageLog';
import NumberLog from '../NumberLog';
import type { LogRenderer, LogViewProps } from './types';

/** The popover of the list renderers: the entries, newest first. */
const ListView = ({ decl, entries }: LogViewProps) => (
  <LogPanel title={decl.title} description={decl.description} logList={entries} />
);

/** `messages` (default): a list of messages, the symbol only says there are some. */
export const messagesRenderer: LogRenderer = {
  name: 'messages',
  display: 'popover',
  Indicator: () => <MessageLog loading={false} hasLogs />,
  View: ListView,
};

/** `problem`: a health indicator from the newest entry's `problem` (green / red). */
export const problemRenderer: LogRenderer = {
  name: 'problem',
  display: 'popover',
  Indicator: ({ latest }) => <BoolLog problem={latest.problem} loading={false} />,
  View: ListView,
};

/** `progress`: a progress ring from the newest entry's `progress` (red on `problem`). */
export const progressRenderer: LogRenderer = {
  name: 'progress',
  display: 'popover',
  Indicator: ({ latest }) => (
    <NumberLog problem={latest.problem} progress={latest.progress} loading={false} />
  ),
  View: ListView,
};
