export function joinUrl(baseUrl: string, path: string): string {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBaseUrl}/${cleanPath}`;
}
