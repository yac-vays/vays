import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LogPanel from '../../src/view/components/EntityList/Logs/LogPanel';
import { LogSlot } from '../../src/view/components/EntityList/Logs/LogsField';
import { getLogRenderer, LOG_RENDERERS } from '../../src/view/components/EntityList/Logs/renderers';
import { downloadFilename } from '../../src/view/components/EntityList/Logs/renderers/document';
import type { EntityLog, LogDecl } from '../../src/utils/types/api';
import { getTestEditRequestContext } from '../testUtils';

// Monaco does not run in jsdom: replace the lazily loaded viewer.
const { findSpy } = vi.hoisted(() => ({ findSpy: vi.fn() }));
vi.mock('../../src/view/components/EntityList/Logs/renderers/DocumentViewer', () => ({
  default: forwardRef<{ find: () => void }, { content: string; language: string }>(
    ({ content, language }, ref) => {
      useImperativeHandle(ref, () => ({ find: findSpy }));
      return (
        <pre data-testid="document-viewer" data-language={language}>
          {content}
        </pre>
      );
    },
  ),
}));

const URL_ = 'https://yac.example.com';
const rc = () => getTestEditRequestContext(URL_, 'test', null, 'bucket', 'edit').rc;

const decl = (renderer: string, options: Record<string, unknown> = {}): LogDecl => ({
  name: 'howto',
  title: 'How to connect',
  description: '',
  renderer,
  options,
});

const entry = (fields: Partial<EntityLog> = {}): EntityLog => ({
  name: 'howto',
  message: 'Connection details',
  time: '2026-11-18T12:00:00Z',
  progress: null,
  problem: null,
  has_content: true,
  ...fields,
});

function respond(status: number, body: object) {
  return {
    status,
    json: () => Promise.resolve(body),
    clone() {
      return this;
    },
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  findSpy.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe('renderer registry', () => {
  it('knows the built-in renderers', () => {
    expect(Object.keys(LOG_RENDERERS).sort()).toEqual(
      ['document', 'markdown', 'messages', 'problem', 'progress'].sort(),
    );
    for (const name of Object.keys(LOG_RENDERERS)) {
      expect(getLogRenderer(decl(name)).name).toBe(name);
    }
    expect(LOG_RENDERERS.document.display).toBe('window');
    expect(LOG_RENDERERS.markdown.display).toBe('window');
    expect(LOG_RENDERERS.messages.display).toBe('popover');
  });

  it('falls back to messages for unknown renderers and complains once', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getLogRenderer(decl('fancy')).name).toBe('messages');
    expect(getLogRenderer(decl('fancy')).name).toBe('messages');
    expect(err).toHaveBeenCalledTimes(1);
  });
});

describe('log slot', () => {
  it('shows the list renderers in a popover', async () => {
    render(
      <LogSlot
        decl={decl('problem')}
        entries={[entry({ problem: true, message: 'disk full' })]}
        loading={false}
        entityName="bucket1"
        requestContext={rc()}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('disk full')).toBeTruthy();
    expect(screen.getByLabelText('Problem')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled(); // no content involved
  });

  it('opens a markdown window and loads the content only then', async () => {
    fetchMock.mockResolvedValue(
      respond(200, { name: 'howto', time: '', content: '## Using bucket `bucket1`' }),
    );
    render(
      <LogSlot
        decl={decl('markdown')}
        entries={[entry()]}
        loading={false}
        entityName="bucket1"
        requestContext={rc()}
      />,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'How to connect' }));

    const dialog = await screen.findByRole('dialog', { name: 'How to connect' });
    expect(await screen.findByText(/Using bucket/)).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe(`${URL_}/entity/bucket/bucket1/logs/howto/content`);
    expect(dialog.textContent).toContain('bucket1');
    expect(dialog.textContent).toContain('Connection details');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows errors in the window and retries', async () => {
    fetchMock.mockResolvedValueOnce(
      respond(404, { title: 'Log content not found', message: 'no content (yet)' }),
    );
    render(
      <LogSlot
        decl={decl('markdown')}
        entries={[entry()]}
        loading={false}
        entityName="bucket1"
        requestContext={rc()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'How to connect' }));
    expect(await screen.findByText(/Status 404.*Log content not found/)).toBeTruthy();

    fetchMock.mockResolvedValueOnce(
      respond(200, { name: 'howto', time: '', content: 'now there' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('now there')).toBeTruthy();
  });

  it('shows a document with search, copy and download', async () => {
    fetchMock.mockResolvedValue(
      respond(200, { name: 'howto', time: '2026-11-18T12:00:00Z', content: 'a: 1\n' }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    let downloaded = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded = this.download;
    });

    render(
      <LogSlot
        decl={decl('document', { language: 'yaml' })}
        entries={[entry()]}
        loading={false}
        entityName="node1"
        requestContext={rc()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'How to connect' }));
    const viewer = await screen.findByTestId('document-viewer');
    expect(viewer.textContent).toBe('a: 1\n');
    expect(viewer.getAttribute('data-language')).toBe('yaml');

    fireEvent.click(screen.getByRole('button', { name: /Search/ }));
    expect(findSpy).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy/ }));
    });
    expect(writeText).toHaveBeenCalledWith('a: 1\n');
    expect(await screen.findByRole('button', { name: /Copied/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Download/ }));
    expect(downloaded).toBe('node1-howto.yaml');
  });

  it('marks problems of window renderers with a light warning', () => {
    const { rerender } = render(
      <LogSlot
        decl={decl('document')}
        entries={[entry({ problem: true })]}
        loading={false}
        entityName="node1"
        requestContext={rc()}
      />,
    );
    expect(screen.getByLabelText('Warning')).toBeTruthy();
    rerender(
      <LogSlot
        decl={decl('document')}
        entries={[entry({ problem: false })]}
        loading={false}
        entityName="node1"
        requestContext={rc()}
      />,
    );
    expect(screen.queryByLabelText('Warning')).toBeNull();
  });
});

describe('log panel', () => {
  it('shows the progress column only if an entry reports a progress', () => {
    const { container, rerender } = render(
      <LogPanel title="T" logList={[entry({ progress: null })]} />,
    );
    expect(container.textContent).not.toContain('%');
    rerender(<LogPanel title="T" logList={[entry({ progress: 40 }), entry({ progress: null })]} />);
    expect(container.textContent).toContain('40%');
  });
});

describe('document options', () => {
  it('builds the download filename', () => {
    expect(downloadFilename('node1', 'facts', {})).toBe('node1-facts.txt');
    expect(downloadFilename('node1', 'facts', { language: 'json' })).toBe('node1-facts.json');
    expect(downloadFilename('node1', 'facts', { filename: '{name}.facts.yml' })).toBe(
      'node1.facts.yml',
    );
  });
});
