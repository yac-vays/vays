#!/bin/sh

rm -rf public/editor
webpack --mode production
vite build
