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

# The build packages the committed OCF agent catalogs, so refresh them from
# their upstreams' default branches here and commit them with the release.
# Runs first, so a failed fetch or type-check stops before anything is bumped.
ocf_catalogs=(
	src/app/components/OcfAgentEditor/all_agents.ts
	src/app/components/OcfAgentEditor/windows_agents.ts
)
npm run generate-agents
npm run generate-agents:windows
npm run type-check

rpmdev-bumpspec -n "$version_and_release" \
	-c "New upstream release" \
	-u "$NAME <$EMAIL>" \
	linstor-gui.spec

dch -v "$version_and_release" \
	-u "medium" \
	"New upstream release" \
	&& dch -r ""

npm version --no-git-tag-version "${version}"

git add linstor-gui.spec debian/changelog package.json package-lock.json "${ocf_catalogs[@]}"
git commit --message "Release v$version"
git tag "v$version"

git --no-pager show
