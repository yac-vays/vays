#!/bin/sh
set -e

rm -rf public/editor
webpack --mode production
vite build
