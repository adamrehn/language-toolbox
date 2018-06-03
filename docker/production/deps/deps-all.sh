#!/usr/bin/env bash
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e

# Install the dependencies for the server core
$SCRIPTDIR/deps-core.sh

# Install the dependencies for each of the language modules
for depscript in $SCRIPTDIR/deps-language-*.sh; do
	echo "Running $depscript..." 1>&2
	"$depscript"
done
