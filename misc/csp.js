/*
 * Write the nginx snippet with the Content-Security-Policy header of
 * index.html at container start (run by `entrypoint.sh` with the njs CLI that
 * ships with the nginx image).
 *
 * The policy depends on `config.json` (backends, OIDC provider, branding) and
 * is built by the very module the app uses for its <meta> tag (cspPolicy.js),
 * so the browser gets the same policy twice - as a header it also covers the
 * time before the app has loaded its config.
 *
 * `entrypoint.sh` has already written the fallback snippet (frame-ancestors
 * only, the app's <meta> policy still applies): any problem here just keeps
 * that one. This must never prevent nginx from starting.
 */
import buildCspPolicy from '/cspPolicy.js';

const fs = require('fs');

const CONFIG = '/usr/share/nginx/html/config.json';
const OUT = '/tmp/csp/index.conf';

// The policy ends up inside a double-quoted nginx string: refuse anything that
// could end the string or the directive, or start a variable (", \, $, {, },
// control characters). Nothing a valid policy needs.
const SAFE = /^[A-Za-z0-9 '\-:;\/.*_~%+=@\[\],?&#!()]+$/;

function log(msg) {
  console.log('csp: ' + msg);
}

function main() {
  let policy;
  try {
    policy = buildCspPolicy(JSON.parse(fs.readFileSync(CONFIG).toString()));
  } catch (e) {
    log('cannot derive the policy from ' + CONFIG + ' (' + e.message + '), header not sent');
    return;
  }
  if (!SAFE.test(policy)) {
    log('the policy contains characters unsafe for the nginx config, header not sent');
    return;
  }

  // frame-ancestors is ignored in <meta>, so it only exists as a header.
  const header = policy + " frame-ancestors 'none';";
  fs.writeFileSync(OUT + '.tmp', 'add_header Content-Security-Policy "' + header + '" always;\n');
  fs.renameSync(OUT + '.tmp', OUT);
  log('sending the policy with index.html');
}

main();
