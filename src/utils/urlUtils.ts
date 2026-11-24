export function joinUrl(baseUrl: string, path: string): string {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBaseUrl}/${cleanPath}`;
}

/**
 * The API path `/entity/<segment>/...` with every segment percent-encoded, so a
 * name can never add path segments, a query or a fragment to the request
 * (entity names come from the page URL).
 */
export function entityPath(...segments: (string | null | undefined)[]): string {
  return '/entity/' + segments.map((s) => encodeURIComponent(String(s))).join('/');
}
