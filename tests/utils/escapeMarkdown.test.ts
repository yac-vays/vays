import { describe, expect, it } from 'vitest';
import { escapeMarkdown } from '../../src/utils/escapeMarkdown';

describe('escapeMarkdown', () => {
  it('leaves plain words alone', () => {
    expect(escapeMarkdown('Missing property users')).toBe('Missing property users');
  });

  it('backslash-escapes everything Markdown or HTML could interpret', () => {
    expect(escapeMarkdown('[click](command:evil)')).toBe('\\[click\\]\\(command:evil\\)');
    expect(escapeMarkdown('<img src=x> &amp;')).toBe('\\<img src=x\\> \\&amp;');
    expect(escapeMarkdown('**b** `c` _d_ ~e~ $(icon) a\\b')).toBe(
      '\\*\\*b\\*\\* \\`c\\` \\_d\\_ \\~e\\~ \\$\\(icon\\) a\\\\b',
    );
    // removing the escapes gives the message back
    const message = 'Property "a.b" is not allowed. Expected: {x|y} #1 + 2 - 3!';
    expect(escapeMarkdown(message).replace(/\\(.)/g, '$1')).toBe(message);
  });

  it('collapses line breaks, which could start a block', () => {
    expect(escapeMarkdown('first\n  # heading\r\n- item')).toBe('first \\# heading \\- item');
  });
});
