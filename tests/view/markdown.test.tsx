import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import MarkdownRender from '../../src/view/components/Markdown';

const render = (text: string, untrusted = false) =>
  renderToStaticMarkup(<MarkdownRender text={text} untrusted={untrusted} />);

const DATA_SVG = 'data:image/svg+xml;base64,PHN2Zy8+#x';

describe('text from the specs (inline SVG allowed)', () => {
  test('a logo with a gradient and <use> keeps its ids and references', () => {
    const html = render(
      '<svg viewBox="0 0 1 1"><defs><linearGradient id="logo-a"><stop offset="0" stop-color="#fff"/></linearGradient>' +
        '<linearGradient id="logo-b" xlink:href="#logo-a"/><path id="logo-p" d="M0 0h1v1z"/></defs>' +
        '<use xlink:href="#logo-p" fill="url(#logo-a)"/><use href="#logo-p"/></svg>',
    );
    expect(html).toContain('id="logo-a"');
    expect(html).toContain('id="logo-p"');
    expect(html).toContain('fill="url(#logo-a)"');
    expect(html.match(/xlink:href="#logo-p"/gi)).toHaveLength(1);
    expect(html).toContain('xlink:href="#logo-a"');
    expect(html).toContain('<use href="#logo-p"');
  });

  test.each([
    DATA_SVG,
    'https://evil.example/x.svg#x',
    'javascript:alert(1)',
    '//evil.example/x#x',
  ])('a reference to %s is dropped', (url) => {
    const html = render(
      `<svg><use xlink:href="${url}"/><use href="${url}"/><linearGradient xlink:href="${url}"/><radialGradient href="${url}"/></svg>`,
    );
    expect(html).toContain('<use');
    expect(html).not.toContain('href');
  });

  test('scripts and event handlers are removed', () => {
    const html = render(
      '<svg onload="alert(1)"><script>alert(1)</script><path d="M0 0" onclick="x()"/></svg>',
    );
    expect(html).not.toContain('alert');
    expect(html).not.toContain('onclick');
  });
});

describe('untrusted text (e.g. log content)', () => {
  test('ids and names are prefixed, so they cannot shadow document properties', () => {
    const html = render(
      '<img name="createElement" src="x.png"><a id="root" name="body">x</a>\n\n<h2 id="root">t</h2>',
      true,
    );
    expect(html).not.toMatch(/(id|name)="(createElement|root|body)"/);
    expect(html).toContain('name="user-content-createElement"');
    expect(html).toContain('id="user-content-root"');
  });

  test('inline SVG is not rendered', () => {
    const html = render(
      `<svg><use xlink:href="${DATA_SVG}"/><rect fill="url(https://evil.example/)"/></svg>`,
      true,
    );
    expect(html).not.toMatch(/<(svg|use|rect)/);
    expect(html).not.toContain('evil.example');
  });

  test('regular Markdown still works', () => {
    const html = render('# Title\n\nSome **bold** [link](https://example.com) and `code`.', true);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('javascript:');
  });

  test('the same markup keeps its ids when it comes from the specs', () => {
    expect(render('<h2 id="root">t</h2>')).toContain('id="root"');
  });
});
