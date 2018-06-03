#!/usr/bin/env bash
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e

# Build the server core
$SCRIPTDIR/build-core.sh

# Build each of the language modules
for buildscript in $SCRIPTDIR/build-language-*.sh; do
	echo "Running $buildscript..." 1>&2
	"$buildscript"
done
