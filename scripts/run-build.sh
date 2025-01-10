#!/bin/sh


VAYS_VERSION=$(npm pkg get version --workspaces=false)

echo "
// Automatically generated version file.
// Please do not remove this file manually.

const VAYS_VERSION = " $VAYS_VERSION ";
export default VAYS_VERSION;

" > rsc/version.tsx
rm -rf public/editor
webpack --mode production
vite build