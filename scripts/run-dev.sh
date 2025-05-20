#!/bin/sh

if [ ! -d "./public/editor" ]; then
    npm run dev-editor
fi

npx vite
