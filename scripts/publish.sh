#!/bin/bash

# Publish a tagged release: build the packages on the lbbuild host from the
# tarball the tag pipeline uploaded to Pulp, and add them to the repos.
#
# This is the part that cannot run in CI: release builds put their packages on
# the localpkgs NFS share, which CI's build containers cannot reach, and
# lbrepoctl signs with a key that is unlocked interactively and pushes to the
# repos with your SSH key (hence -A, and -t for the passphrase prompt).
#
# --dry-run builds the same way but runs `lbrepoctl map` instead of
# `lbrepoctl add --rsync`: it shows where the packages would go and publishes
# nothing.

set -e

die() {
	echo >&2 "$1"
	exit 1
}

usage() {
	die "Usage: $0 [--dry-run] <version>"
}

dry_run=
version=
for arg in "$@"; do
	case "$arg" in
	--dry-run) dry_run=1 ;;
	-*) usage ;;
	*) [ -z "$version" ] || usage; version=$arg ;;
	esac
done
[ -z "$version" ] && usage

host=${LBBUILD_HOST:-lbbuild@c64.at.linbit.com}
tarball="linstor-gui-$version.tar.gz"
pulp_url="https://pulp.at.linbit.com/pulp/content/file/lbbuild-upstream/$tarball"

# Only publish what CI built from the tag: the build job checks the versions and
# makes the tarball, deploy uploads it to Pulp and test-builds the packages.
# Other jobs (sbom) do not decide what gets published.
pipeline=$(glab api "projects/:id/pipelines?ref=v$version&per_page=1" | jq -r '.[0].id // empty')
[ -n "$pipeline" ] || die "No pipeline for tag v$version"
for job in build deploy; do
	status=$(glab api "projects/:id/pipelines/$pipeline/jobs?per_page=100" |
		jq -r --arg job "$job" '[.[] | select(.name == $job)][0].status // "missing"')
	[ "$status" = success ] || die "Job $job of pipeline $pipeline (v$version) is '$status', not 'success'"
done

if [ -n "$dry_run" ]; then
	repo_cmd="lbrepoctl map linstor-gui -v $version"
else
	repo_cmd="lbrepoctl add linstor-gui -v $version --rsync"
fi

# What the lbbuild account's .bashrc does for an interactive login, which a
# command run over ssh does not get: the tools' directory on PATH, and as the
# working directory.
ssh -At "$host" "set -e
cd ~/lbbuild
PATH=\$HOME/lbbuild:\$PATH
curl -fsSL -o upstream/$tarball $pulp_url
lbbuildctl build linstor-gui -v $version -a amd64
$repo_cmd"
