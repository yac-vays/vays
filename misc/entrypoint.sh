#!/bin/sh
# Materialise the configured favicon (see favicon.js), then hand over to nginx.
# The favicon step must never prevent nginx from starting.
njs /favicon.js || echo "favicon: failed, keeping the built-in one"

# Content-Security-Policy header of index.html (included by nginx.conf). Start
# with the fallback, then let csp.js replace it with the full policy derived
# from config.json. Whatever goes wrong, nginx starts with a valid snippet.
CSP_SNIPPET=/tmp/csp/index.conf
csp_fallback() {
    echo "add_header Content-Security-Policy \"frame-ancestors 'none'\" always;" > "$CSP_SNIPPET"
}
mkdir -p /tmp/csp
csp_fallback
njs /csp.js || { echo "csp: failed, header not sent"; csp_fallback; }
if ! nginx -t -q; then
    echo "csp: nginx rejects the generated header, header not sent"
    csp_fallback
fi

exec nginx -g "daemon off;"
