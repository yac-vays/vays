/*
 * Materialise `config.favicon` as a static file at container start (run by
 * `entrypoint.sh` with the njs CLI that ships with the nginx image).
 *
 * Safari ignores favicon changes made from JavaScript (see
 * `src/session/favicon.ts`), so the configured icon must already be what the
 * static `<link rel="icon" href="/favicon.svg">` in index.html points to.
 * nginx serves `/favicon.svg` from OUT_DIR, falling back to the built-in
 * `/favicon.svg` of the html root when nothing was written here (see
 * `nginx.conf`).
 *
 * Handled: inline SVG markup, `data:` URIs of the image types below, and
 * same-origin paths (copied from the html root). Absolute URLs cannot be
 * served statically: they are only applied by the app at runtime (not in
 * Safari). Any problem is logged and the built-in favicon is kept - this must
 * never prevent nginx from starting.
 */
const fs = require('fs');

const HTML_ROOT = '/usr/share/nginx/html';
const CONFIG = HTML_ROOT + '/config.json';
const OUT_DIR = '/tmp/branding';

// Media type -> file extension. Must match the try_files list in nginx.conf.
const TYPES = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const EXTENSIONS = { svg: 1, png: 1, ico: 1, gif: 1, jpg: 1, jpeg: 1, webp: 1 };

function log(msg) {
  console.log('favicon: ' + msg);
}

/** Return [extension, Buffer] for the configured favicon, or null to keep the built-in one. */
function resolve(favicon) {
  const trimmed = favicon.trimStart();

  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return ['svg', Buffer.from(favicon)];
  }

  if (trimmed.startsWith('data:')) {
    const comma = trimmed.indexOf(',');
    if (comma < 0) throw new Error('malformed data: URI');
    const params = trimmed.slice(5, comma).split(';');
    const type = params[0].toLowerCase();
    if (!TYPES[type]) throw new Error('unsupported data: URI type "' + type + '"');
    const payload = trimmed.slice(comma + 1);
    const data =
      params.indexOf('base64') > 0
        ? Buffer.from(payload, 'base64')
        : Buffer.from(decodeURIComponent(payload));
    return [TYPES[type], data];
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const path = trimmed.split(/[?#]/)[0];
    const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
    if (!EXTENSIONS[ext]) throw new Error('unsupported file type of "' + path + '"');
    const file = fs.realpathSync(HTML_ROOT + decodeURIComponent(path));
    if (!file.startsWith(HTML_ROOT + '/'))
      throw new Error('"' + path + '" is outside the html root');
    return [ext == 'jpeg' ? 'jpg' : ext, fs.readFileSync(file)];
  }

  log('absolute URL, only applied at runtime (not in Safari)');
  return null;
}

function main() {
  // Start from a clean slate: the emptyDir survives container restarts.
  if (fs.readdirSync('/tmp').indexOf('branding') >= 0) {
    fs.readdirSync(OUT_DIR).forEach((f) => fs.unlinkSync(OUT_DIR + '/' + f));
  } else {
    fs.mkdirSync(OUT_DIR);
  }

  let favicon;
  try {
    favicon = JSON.parse(fs.readFileSync(CONFIG).toString()).favicon;
  } catch (e) {
    log('cannot read ' + CONFIG + ' (' + e.message + '), keeping the built-in one');
    return;
  }
  if (typeof favicon != 'string' || favicon.trim() == '') {
    log('not configured, keeping the built-in one');
    return;
  }

  let resolved;
  try {
    resolved = resolve(favicon);
  } catch (e) {
    log(e.message + ', keeping the built-in one');
    return;
  }
  if (resolved == null) return;

  fs.writeFileSync(OUT_DIR + '/favicon.' + resolved[0], resolved[1]);
  log('serving the configured ' + resolved[0] + ' (' + resolved[1].length + ' bytes)');
}

main();
