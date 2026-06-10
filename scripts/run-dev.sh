#!/bin/sh
set -e

if [ ! -d "./public/editor" ]; then
    npm run dev-editor
fi

npx vite
