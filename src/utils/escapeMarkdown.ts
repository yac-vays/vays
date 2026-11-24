/**
 * `text` as literal Markdown text: Markdown punctuation and `<` / `&` are
 * backslash-escaped, line breaks collapse (they could start a block).
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>&~$]/g, '\\$&').replace(/\s*[\r\n]+\s*/g, ' ');
}
