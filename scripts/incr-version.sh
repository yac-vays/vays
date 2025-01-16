#!/bin/bash

HELP_MSG="USAGE: incr-version.sh [rc|minor] [--merge] 
 where the first argument tells whether it is a new rc release or minor upgrade,
 and if the second argument is present, then the development branch is merged into testing."




function increase_rc() {
    local VERSION=$1

    # Check if the VERSION contains "rc"
    if [[ "$VERSION" == *rc* ]]; then
        # Extract the base version and the rc number
        local BASE_VERSION=$(echo "$VERSION" | sed 's/rc[0-9]*$//')
        local RC_NUMBER=$(echo "$VERSION" | sed 's/^[^rc]*rc//' )
        
        # Increment the rc version number
        local NEW_RC_NUMBER=$((RC_NUMBER + 1))
        
        # Form the new version with incremented rc number
        local NEW_VERSION="${BASE_VERSION}rc${NEW_RC_NUMBER}"
    else
        # If no rc, increment the minor version and add "rc1"
        local BASE_VERSION=$VERSION
        local NEW_MINOR_VERSION=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2+1}')
        
        # Form the new version with incremented minor version and "rc1"
        local NEW_VERSION="${NEW_MINOR_VERSION}rc1"
    fi

    # Output the new version
    echo "$NEW_VERSION"
}

function increase_minor() {
    local VERSION=$1

    # Check if the VERSION contains "rc"
    if echo "$VERSION" | grep -q "rc"; then
        # If "rc" is present, remove the "rc" part and leave the rest of the version
        BASE_VERSION=$(echo "$VERSION" | sed 's/rc[0-9]*$//')
        echo "$BASE_VERSION"
    else
        # If no "rc" is present, increment the minor version
        BASE_VERSION=$VERSION
        NEW_MINOR_VERSION=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2+1}')
        echo "$NEW_MINOR_VERSION"
    fi
}


VAYS_VERSION="$(npm pkg get version --workspaces=false | sed 's/"//g')"

#### First. get the new version
if [[ "$1" == "rc" ]]; then 
    v=$(increase_rc $VAYS_VERSION)
    
elif [[ "$1" == "minor" ]]; then
    v=$(increase_minor $VAYS_VERSION)
else
    echo "Bad first argument"
    echo "$HELP_MSG"
    exit 1
fi

#### Next, check whether to merge locally
if [[ "$2" == "--merge" ]]; then
    echo "Merging development branch into testing branch"
    MERGE=0
elif [[ "$2" != "" ]]; then
    echo "Bad second argument"
    echo "$HELP_MSG"
    exit 1
else
    echo "Not merging development branch into test branch"
    MERGE=1
fi

#### Print all info so far
STR_VERSION="v$v"
echo "Setting version from VAYS $VAYS_VERSION -> $v"
echo "New git tag will be $STR_VERSION"

read -p "Do you want to continue? (Y/n): " user_input

#### Check the user input
#############################################################################
if [ "$user_input" = "n" ] || [ "$user_input" = "N" ]; then
    echo "You chose not to continue. Exiting..."
    exit 0
fi
#############################################################################

git checkout development
npm pkg set version=$v

echo "
// Automatically generated version file.
// Please do not remove this file manually.

const VAYS_VERSION = '"$v"';
export default VAYS_VERSION;

" > rsc/version.tsx
git add -A
git commit -m "[Automated]: Increase version to $v"


if [[ $MERGE -eq 0 ]]; then
    git checkout testing
    git merge development
else
    echo "Skipping merging development branch into test branch"
fi

git checkout testing
git tag $STR_VERSION

git push origin $STR_VERSION testing development


