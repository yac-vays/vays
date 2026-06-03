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

  it('keeps presentation attributes on a flattened multi-colour SVG', () => {
    const { container } = render(
      <MarkdownRender text='<svg viewBox="0 0 10 10"><path d="M0 0h5v10H0z" fill="#e00"/><path d="M5 0h5v10H5z" fill="#fff" fill-opacity="0.6" stroke-width="0.5"/></svg>' />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute('fill')).toBe('#e00');
    expect(paths[1].getAttribute('fill-opacity')).toBe('0.6');
    expect(paths[1].getAttribute('stroke-width')).toBe('0.5');
  });

  it('renders gradient defs and a <title> hover label', () => {
    const { container } = render(
      <MarkdownRender text='<svg viewBox="0 0 10 10"><title>OS</title><defs><linearGradient id="g"><stop offset="0" stop-color="#e00"/><stop offset="1" stop-color="#900"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>' />,
    );
    expect(container.querySelector('linearGradient')).not.toBeNull();
    expect(container.querySelectorAll('stop')).toHaveLength(2);
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('url(#g)');
    expect(container.querySelector('title')?.textContent).toBe('OS');
  });

  it('still strips <style> so an alias cannot restyle the page', () => {
    const { container } = render(
      <MarkdownRender text='<svg viewBox="0 0 10 10"><style>.x{fill:#e00}</style><path class="x" d="M0 0h10v10H0z"/></svg>' />,
    );
    expect(container.querySelector('style')).toBeNull();
  });

  it('keeps internal id references intact (<use> + gradient) — no clobber prefix', () => {
    const { container } = render(
      <MarkdownRender text='<svg viewBox="0 0 10 10"><defs><linearGradient id="grad-x"><stop offset="0" stop-color="#e00"/></linearGradient></defs><g id="frag-y"><circle cx="2" cy="2" r="2" fill="#fff"/></g><rect width="10" height="10" fill="url(#grad-x)"/><use xlink:href="#frag-y" transform="rotate(120 5 5)"/></svg>' />,
    );
    // ids must NOT be rewritten to user-content-*, or url(#)/href(#) refs break
    expect(container.querySelector('#grad-x')).not.toBeNull();
    expect(container.querySelector('#frag-y')).not.toBeNull();
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('url(#grad-x)');
    expect(container.querySelector('use')).not.toBeNull();
  });
});
