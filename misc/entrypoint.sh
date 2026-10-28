#!/bin/sh
# Materialise the configured favicon (see favicon.js), then hand over to nginx.
# The favicon step must never prevent nginx from starting.
njs /favicon.js || echo "favicon: failed, keeping the built-in one"

exec nginx -g "daemon off;"
