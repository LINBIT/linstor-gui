#!/bin/bash

set -e

die() {
	echo >&2 "$1"
	exit 1
}

version=$1
[ -z "$version" ] && die "Usage: $0 <version>"

export EMAIL="$(git config --get user.email)"
export NAME="$(git config --get user.name)"

version_and_release="${version}-1"

rpmdev-bumpspec -n "$version_and_release" \
	-c "New upstream release" \
	-u "$NAME <$EMAIL>" \
	linstor-gui.spec

dch -v "$version_and_release" \
	-u "medium" \
	"New upstream release" \
	&& dch -r ""

npm version --no-git-tag-version "${version}"

git add linstor-gui.spec debian/changelog
git commit --message "Release v$version"
git tag "v$version"

git --no-pager show
