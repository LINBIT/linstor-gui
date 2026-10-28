#!/bin/bash

set -e
# set -e exits silently; say which command it was.
trap 'echo >&2 "$0: \"$BASH_COMMAND\" failed"' ERR

die() {
	echo >&2 "$1"
	exit 1
}

version=$1
[ -z "$version" ] && die "Usage: $0 <version>"

export EMAIL="$(git config --get user.email)"
export NAME="$(git config --get user.name)"

version_and_release="${version}-1"

# Check everything that would make the release wrong before touching anything:
# a clean main that has everything from origin, a new tag, and release notes.
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "Working tree is not clean"
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || die "Not on main"
# Only main: fetching all tags fails as soon as any local tag differs from
# origin's, which has nothing to do with this release.
git fetch --quiet origin main
git merge-base --is-ancestor origin/main HEAD || die "main is behind origin/main"
git rev-parse --quiet --verify "refs/tags/v$version" >/dev/null && die "Tag v$version already exists locally"
git ls-remote --exit-code --tags origin "refs/tags/v$version" >/dev/null && die "Tag v$version already exists on origin"
grep -q "^# $version " CHANGELOG.md || die "CHANGELOG.md has no '# $version' section"

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

# Review before anything leaves the machine. The pager matters: the OCF
# catalogs can make this a long diff.
git show

# The tag pipeline builds the release tarball and uploads it to Pulp;
# scripts/publish.sh takes it from there.
read -r -p "Push main and v$version to origin? [y/N] " answer || answer=
case "$answer" in
[yY]*)
	git push --atomic origin main "v$version"
	;;
*)
	echo "Not pushed. To push: git push --atomic origin main v$version"
	echo "To undo: git tag -d v$version && git reset --hard HEAD^"
	;;
esac
