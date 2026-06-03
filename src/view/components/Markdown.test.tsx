import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarkdownRender from './Markdown';

describe('MarkdownRender', () => {
  it('renders inline SVG sent via an alias', () => {
    const { container } = render(
      <MarkdownRender text='<svg viewBox="0 0 24 24" width="16" height="16" fill="green"><circle cx="12" cy="12" r="10" /></svg> OK' />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.textContent).toContain('OK');
  });

  it('still renders normal markdown', () => {
    const { container } = render(<MarkdownRender text="**bold** and _italic_" />);
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('em')?.textContent).toBe('italic');
  });

  it('strips dangerous HTML even when it looks like an alias', () => {
    const { container } = render(
      <MarkdownRender text='<script>alert(1)</script><img src="x" onerror="alert(1)" />' />,
    );
    expect(container.querySelector('script')).toBeNull();
    // sanitize removes the on* handler if the <img> survives at all
    expect(container.querySelector('img[onerror]')).toBeNull();
  });
});
