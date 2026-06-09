/**
 * Turn a config-supplied image value into something usable as an `<img>` src or
 * a favicon `href`. Inline SVG markup (sent directly in `config.json`, e.g. for
 * the `logo` / `favicon`) is wrapped into a `data:` URI; any other value — a
 * URL, a same-origin path, or an existing `data:` URI — is returned unchanged.
 */
export function asImageSource(value: string): string {
  const trimmed = value.trimStart();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(value)}`;
  }
  return value;
}
