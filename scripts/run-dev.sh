
VAYS_VERSION=$(npm pkg get version --workspaces=false)

echo "
// Automatically generated version file.
// Please do not remove this file manually.

const VAYS_VERSION = " $VAYS_VERSION ";
export default VAYS_VERSION;

" > rsc/version.tsx

if [ ! -d "./public/editor" ]; then
    npm run dev-editor
fi


npx vite